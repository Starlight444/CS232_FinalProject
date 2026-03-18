from models.announcement_model import Announcement
from models.course_member_model import CourseMember

class AnnouncementRepository:
    def __init__(self, db):
        self.db = db

    def create(self, announcement: Announcement) -> Announcement:
        self.db.add(announcement)
        self.db.commit()
        self.db.refresh(announcement)
        return announcement

    def get_by_course(self, course_id: str) -> list[Announcement]:
        return (
            self.db.query(Announcement)
            .filter(Announcement.course_id == course_id)
            .order_by(Announcement.created_at.desc())
            .all()
        )

    def get_by_id(self, announcement_id: str) -> Announcement | None:
        return (
            self.db.query(Announcement)
            .filter(Announcement.announcement_id == announcement_id)
            .first()
        )

    def update(self, announcement: Announcement) -> Announcement:
        self.db.commit()
        self.db.refresh(announcement)
        return announcement

    def get_course_member(self, user_id: str, course_id: str) -> CourseMember | None:
        return (
            self.db.query(CourseMember)
            .filter(
                CourseMember.user_id == user_id,
                CourseMember.course_id == course_id
            )
            .first()
        )