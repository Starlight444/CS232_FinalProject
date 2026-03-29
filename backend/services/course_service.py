from repositories.course_repository import CourseRepository
from repositories.course_member_repository import CourseMemberRepository
from repositories.assignment_repository import AssignmentRepository
from repositories.submission_repository import SubmissionRepository


class CourseService:
    def __init__(self, db):
        self.db = db
        self.course_repository = CourseRepository(db)
        self.member_repo = CourseMemberRepository(db)
        self.assignment_repo = AssignmentRepository(db)
        self.submission_repo = SubmissionRepository(db)

    def list_courses(self):
        return self.course_repository.get_all_courses()

    def list_courses_by_user(self, user_id: str, role: str = None):
        return self.course_repository.get_courses_by_user(user_id, role)

    def get_course_by_id(self, course_id: str):
        return self.course_repository.get_course_by_id(course_id)
