from sqlalchemy.orm import Session
from models.course_member_model import CourseMember
from models.user_model import User
import uuid


class CourseMemberRepository:

    def __init__(self, db):
        self.db = db

    def get_members_only(self, course_id):
        return (
            self.db.query(CourseMember)
            .filter(CourseMember.course_id == course_id)
            .all()
        )

    def get_members_by_course(self, course_id):
        return (
            self.db.query(User)
            .join(CourseMember, CourseMember.user_id == User.user_id)
            .filter(CourseMember.course_id == course_id)
            .all()
        )
    
    def get_students_by_course(self, course_id):
        return (
            self.db.query(User)
            .join(CourseMember, CourseMember.user_id == User.user_id)
            .filter(
                CourseMember.course_id == course_id,
                CourseMember.role == "student"
            )
            .all()
        )

    def get_role(self, user_id, course_id):
        member = (
            self.db.query(CourseMember)
            .filter(
                CourseMember.user_id == user_id,
                CourseMember.course_id == course_id
            )
            .first()
        )

        return member.role if member else None
