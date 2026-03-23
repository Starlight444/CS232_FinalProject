from sqlalchemy.orm import Session
from models.course_model import Course


class CourseRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_course_by_code(self, code: str):
        return self.db.query(Course).filter(
            Course.course_code == code
        ).first()

    def get_all_courses(self):
        return self.db.query(Course).all()
