from sqlalchemy.orm import Session
from models.course_model import Course
from models.course_member_model import CourseMember


class CourseRepository:
    def __init__(self):
        pass

    def get_all_courses(self, db: Session):
        return db.query(Course).all()

    def get_course_by_code(self, db: Session, course_code: str):
        return db.query(Course).filter(Course.course_code == course_code).first()

    def get_course_by_id(self, db: Session, course_id: str):
        return db.query(Course).filter(Course.course_id == course_id).first()

    def get_courses_by_user(self, db: Session, user_id: str, role: str = None):
        query = (
            db.query(Course)
            .join(CourseMember, Course.course_id == CourseMember.course_id)
            .filter(CourseMember.user_id == user_id)
        )

        if role:
            query = query.filter(CourseMember.role == role)

        return query.all()