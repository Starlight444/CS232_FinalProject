from sqlalchemy.orm import Session
from models.course_member_model import CourseMember
import uuid

class CourseMemberRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_members_by_course(self, course_id: uuid.UUID):
        return self.db.query(CourseMember).filter(
            CourseMember.course_id == course_id
        ).all()