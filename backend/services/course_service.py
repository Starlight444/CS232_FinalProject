from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
from models.course_model import Course
from models.course_member_model import CourseMember
from repositories.course_repository import CourseRepository
from repositories.course_member_repository import CourseMemberRepository


class CourseService:
    def __init__(self, db: Session):
        self.db = db
        self.course_repo = CourseRepository(db)
        self.member_repo = CourseMemberRepository(db)

    def list_courses(self):
        return self.course_repo.get_all_courses()