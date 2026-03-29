from sqlalchemy import func

from models.course_model import Course
from models.course_member_model import CourseMember
from models.assignment_model import Assignment  # ADDED
from models.submission_model import Submission  # ADDED


class CourseRepository:
    def __init__(self, db):
        self.db = db

    def get_all_courses(self):
        # ADDED: นับจำนวนนักศึกษาในแต่ละ course
        student_count_subquery = (
            self.db.query(
                CourseMember.course_id.label("course_id"),
                func.count(CourseMember.member_id).label("total_std")
            )
            .filter(CourseMember.role == "student")
            .group_by(CourseMember.course_id)
            .subquery()
        )

        # ADDED: นับจำนวน assignment ในแต่ละ course
        assignment_count_subquery = (
            self.db.query(
                Assignment.course_id.label("course_id"),
                func.count(Assignment.assignment_id).label("total_assign")
            )
            .group_by(Assignment.course_id)
            .subquery()
        )

        # ADDED: นับ submission รวมของทุก assignment ใน course
        # ตาม requirement คือ "เอาคนส่งในแต่ละการบ้านบวกกัน"
        # ดังนั้นนับจำนวน submission ทั้งหมด ไม่ distinct student_id
        submission_count_subquery = (
            self.db.query(
                Assignment.course_id.label("course_id"),
                func.count(Submission.submission_id).label("total_submitted_student")
            )
            .outerjoin(
                Submission,
                Assignment.assignment_id == Submission.assignment_id
            )
            .group_by(Assignment.course_id)
            .subquery()
        )

        rows = (
            self.db.query(
                Course.course_id,
                Course.course_code,
                Course.course_name,
                Course.description,
                func.coalesce(student_count_subquery.c.total_std, 0).label("total_std"),
                func.coalesce(assignment_count_subquery.c.total_assign, 0).label("total_assign"),
                func.coalesce(
                    submission_count_subquery.c.total_submitted_student, 0
                ).label("total_submitted_student"),
            )
            .outerjoin(
                student_count_subquery,
                Course.course_id == student_count_subquery.c.course_id
            )
            .outerjoin(
                assignment_count_subquery,
                Course.course_id == assignment_count_subquery.c.course_id
            )
            .outerjoin(
                submission_count_subquery,
                Course.course_id == submission_count_subquery.c.course_id
            )
            .all()
        )

        # ADDED: แปลงเป็น dict เพื่อให้ response_model รับ field ที่เพิ่มได้ตรงๆ
        return [
            {
                "course_id": row.course_id,
                "course_code": row.course_code,
                "course_name": row.course_name,
                "description": row.description,
                "total_std": row.total_std,
                "total_assign": row.total_assign,
                "total_submitted_student": row.total_submitted_student,
            }
            for row in rows
        ]

    def get_course_by_code(self, course_code: str):
        return self.db.query(Course).filter(Course.course_code == course_code).first()

    def get_course_by_id(self, course_id: str):
        return self.db.query(Course).filter(Course.course_id == course_id).first()

    def get_courses_by_user(self, user_id: str, role: str = None):
        # ADDED: นับจำนวนนักศึกษาในแต่ละ course
        student_count_subquery = (
            self.db.query(
                CourseMember.course_id.label("course_id"),
                func.count(CourseMember.member_id).label("total_std")
            )
            .filter(CourseMember.role == "student")
            .group_by(CourseMember.course_id)
            .subquery()
        )

        # ADDED: นับจำนวน assignment ในแต่ละ course
        assignment_count_subquery = (
            self.db.query(
                Assignment.course_id.label("course_id"),
                func.count(Assignment.assignment_id).label("total_assign")
            )
            .group_by(Assignment.course_id)
            .subquery()
        )

        # ADDED: นับ submission รวมของทุก assignment ใน course
        submission_count_subquery = (
            self.db.query(
                Assignment.course_id.label("course_id"),
                func.count(Submission.submission_id).label("total_submitted_student")
            )
            .outerjoin(
                Submission,
                Assignment.assignment_id == Submission.assignment_id
            )
            .group_by(Assignment.course_id)
            .subquery()
        )

        query = (
            self.db.query(
                Course.course_id,
                Course.course_code,
                Course.course_name,
                Course.description,
                func.coalesce(student_count_subquery.c.total_std, 0).label("total_std"),
                func.coalesce(assignment_count_subquery.c.total_assign, 0).label("total_assign"),
                func.coalesce(
                    submission_count_subquery.c.total_submitted_student, 0
                ).label("total_submitted_student"),
            )
            .join(CourseMember, Course.course_id == CourseMember.course_id)
            .outerjoin(
                student_count_subquery,
                Course.course_id == student_count_subquery.c.course_id
            )
            .outerjoin(
                assignment_count_subquery,
                Course.course_id == assignment_count_subquery.c.course_id
            )
            .outerjoin(
                submission_count_subquery,
                Course.course_id == submission_count_subquery.c.course_id
            )
            .filter(CourseMember.user_id == user_id)
        )

        if role:
            query = query.filter(CourseMember.role == role)

        rows = query.all()

        # ADDED: แปลงเป็น dict เพื่อให้ response_model รับ field ที่เพิ่มได้ตรงๆ
        return [
            {
                "course_id": row.course_id,
                "course_code": row.course_code,
                "course_name": row.course_name,
                "description": row.description,
                "total_std": row.total_std,
                "total_assign": row.total_assign,
                "total_submitted_student": row.total_submitted_student,
            }
            for row in rows
        ]