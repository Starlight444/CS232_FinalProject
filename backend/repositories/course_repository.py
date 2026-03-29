from models.course_model import Course
from models.course_member_model import CourseMember



class CourseRepository:
    def __init__(self, db):
        self.db = db

    def get_all_courses(self):
        return self.db.query(Course).all()

    def get_course_by_code(self, course_code: str):
        return self.db.query(Course).filter(Course.course_code == course_code).first()

    def get_course_by_id(self, course_id: str):
        return self.db.query(Course).filter(Course.course_id == course_id).first()

    def get_courses_by_user(self, user_id: str, role: str = None):
        query = (
            self.db.query(Course)
            .join(CourseMember, Course.course_id == CourseMember.course_id)
            .filter(CourseMember.user_id == user_id)
        )

        if role:
            query = query.filter(CourseMember.role == role)

        return query.all()
