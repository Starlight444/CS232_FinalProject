from sqlalchemy.orm import Session
from models.course_model import Course

def get_course_by_code(db: Session, code: str):
    return db.query(Course).filter(Course.course_code == code).first()

def get_all_courses(db: Session):
    return db.query(Course).all()