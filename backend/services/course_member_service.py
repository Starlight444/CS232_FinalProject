from sqlalchemy.orm import Session
from repositories.course_member_repository import CourseMemberRepository


class CourseMemberService:
    def __init__(self):
        self.course_member_repository = CourseMemberRepository()

    def get_members_by_course(self, db: Session, course_id: str):
        return self.course_member_repository.get_members_by_course(db, course_id)

    def get_role(self, db: Session, user_id: str, course_id: str):
        return self.course_member_repository.get_role(db, user_id, course_id)

    def get_memberships_by_user(self, db: Session, user_id: str, role: str = None):
        return self.course_member_repository.get_memberships_by_user(db, user_id, role)