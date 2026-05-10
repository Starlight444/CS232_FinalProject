import uuid
import boto3          # เพิ่ม
import logging        # เพิ่ม
from models.announcement_model import Announcement
from models.user_model import User
from repositories.announcement_repository import AnnouncementRepository

logger = logging.getLogger(__name__)  # เพิ่ม

ALLOWED_ROLES = {"teacher", "ta"}

class AnnouncementService:
    def __init__(self, repo: AnnouncementRepository):
        self.repo = repo
        # self.sns_client = boto3.client("sns")        # เพิ่มตอนทำ SNS
        # self.topic_arn  = sns_topic_arn              # เพิ่มตอนทำ SNS

    def create_announcement(self, title: str, content: str, course_id: str, requester_id: str) -> Announcement:
        member = self.repo.get_course_member(requester_id, course_id)
        if not member or member.role not in ALLOWED_ROLES:
            raise PermissionError("Only Professor or TA can create announcements")

        announcement = Announcement(
            announcement_id=uuid.uuid4(),
            title=title,
            content=content,
            created_by=requester_id,
            course_id=course_id,
        )
        saved = self.repo.create(announcement)

        # try:                                         # เพิ่มตอนทำ SNS
        #     self._publish_notification(saved)        # เพิ่มตอนทำ SNS
        # except Exception as e:                       # เพิ่มตอนทำ SNS
        #     logger.error(f"SNS publish failed: {e}") # เพิ่มตอนทำ SNS

        return saved

    def get_by_course(self, course_id: str):
        return self.repo.get_by_course(course_id)

    def get_by_id(self, announcement_id: str) -> Announcement:
        announcement = self.repo.get_by_id(announcement_id)
        if not announcement:
            raise ValueError("Announcement not found")
        return announcement

    def update_announcement(self, announcement_id: str, title: str, content: str, requester_id: str) -> Announcement:
        announcement = self.get_by_id(announcement_id)
        if str(announcement.created_by) != str(requester_id):
            raise PermissionError("Only the creator can edit this announcement")
        announcement.title   = title
        announcement.content = content
        return self.repo.update(announcement)
    
    def get_all_announcements(self, user_id, external_repo, course_repo):
        internal = (self.repo.db.query(Announcement, User).join(User, Announcement.created_by == User.user_id).all())
        external = external_repo.get_by_user(user_id)

        result = []

        # ===== INTERNAL =====
        for a, u in internal:
            result.append({
                "id": str(a.announcement_id),
                "title": a.title,
                "content": a.content,
                "created_at": a.created_at,
                "course_id": str(a.course_id),
                "author_name": f"{u.first_name} {u.last_name}",
                "is_external": False
            })

        # ===== EXTERNAL =====
        for e in external:
            # map course_code → course_id
            course = course_repo.get_course_by_code(e.external_course_code)

            result.append({
                "id": str(e.id),
                "title": e.title,
                "created_at": e.created_at,
                "course_id": str(course.course_id) if course else None,
                "author": e.author,
                "course_name": e.external_course_name,
                "course_link": e.external_course_url,
                "box_link": e.external_link,
                "is_external": True
            })

        return result

    # def _publish_notification(self, announcement: Announcement):   # เพิ่มตอนทำ SNS
    #     self.sns_client.publish(                                    # เพิ่มตอนทำ SNS
    #         TopicArn=self.topic_arn,                                # เพิ่มตอนทำ SNS
    #         Subject=f"New Announcement: {announcement.title}",      # เพิ่มตอนทำ SNS
    #         Message=announcement.content,                           # เพิ่มตอนทำ SNS
    #         MessageAttributes={                                     # เพิ่มตอนทำ SNS
    #             "courseID": {                                       # เพิ่มตอนทำ SNS
    #                 "DataType": "String",                           # เพิ่มตอนทำ SNS
    #                 "StringValue": str(announcement.course_id),     # เพิ่มตอนทำ SNS
    #             }                                                   # เพิ่มตอนทำ SNS
    #         },                                                      # เพิ่มตอนทำ SNS
    #     )                                                           # เพิ่มตอนทำ SNS
    #   ตอนทำ SNS อย่าลืมเพิ่ม SNS_TOPIC_ARN ใน config.py และ .env