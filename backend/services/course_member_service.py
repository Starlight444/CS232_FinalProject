from sqlalchemy.orm import Session
import uuid
from repositories.course_member_repository import CourseMemberRepository


class CourseMemberService:
    def __init__(self, db):
        self.repo = CourseMemberRepository(db)

    def get_members(self, course_id):
        return self.repo.get_members_only(course_id)

    def get_students(self, course_id):
        users = self.repo.get_students_by_course(course_id)
        
        return [
            {
                "user_id": u.user_id,
                "name": f"{u.first_name} {u.last_name}"
            }
            for u in users
        ]