from sqlalchemy.orm import Session
from repositories.course_repository import CourseRepository


class CourseService:
    def __init__(self):
        self.course_repository = CourseRepository()

    def list_courses(self, db: Session):
        return self.course_repository.get_all_courses(db)

    def list_courses_by_user(self, db: Session, user_id: str, role: str = None):
        return self.course_repository.get_courses_by_user(db, user_id, role)

    def get_course_by_id(self, db: Session, course_id: str):
        return self.course_repository.get_course_by_id(db, course_id)