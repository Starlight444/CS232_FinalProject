from sqlalchemy.orm import Session
from models.course_model import Course

class CourseRepository:
    def __init__(self, db):
        self.db = db

    def create_course(db: Session, course_obj: Course):
        db.add(course_obj)
        db.flush()
        return course_obj

    def get_course_by_code(db: Session, code: str):
        return db.query(Course).filter(Course.course_code == code).first()

    def get_all_courses(db: Session):
        return db.query(Course).all()
