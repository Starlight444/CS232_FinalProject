from sqlalchemy.orm import Session
import uuid
from repositories.course_member_repository import CourseMemberRepository


class CourseMemberService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CourseMemberRepository(db)

    def get_students(self, course_id: uuid.UUID):
        return self.repo.get_members_by_course(course_id)