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

    def list_courses_by_user(self, user_id: str, role: str = None):
        courses = self.course_repository.get_courses_by_user(user_id, role)

        result = []
        for c in courses:
            result.append({
                "course_id": str(c.course_id),
                "course_code": c.course_code,
                "course_name": c.course_name,
                "role": self.member_repo.get_role(user_id, c.course_id),

                "total_std": self.member_repo.count_students(c.course_id),
                "total_assign": self.assignment_repo.count_assignments(c.course_id),
                "total_submitted_student": self.submission_repo.count_submitted_students(c.course_id)
            })

        return result
    
    def get_course_with_assignments(self, course_id):
        course = self.course_repo.get_by_id(course_id)
        
        assignments = self.assignment_repo.get_by_course_id(course_id)

        return {
            "course_id": course.id,
            "name": course.name,
            "assignments": assignments
        }
