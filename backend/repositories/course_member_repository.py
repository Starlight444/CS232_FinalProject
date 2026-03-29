from models.course_member_model import CourseMember


class CourseMemberRepository:

    def __init__(self, db):
        self.db = db

    def get_members_by_course(self, course_id: str):
        return self.db.query(CourseMember).filter(CourseMember.course_id == course_id).all()

    def get_role(self, user_id, course_id):
        member = (
            self.db.query(CourseMember)
            .filter(
                CourseMember.user_id == user_id,
                CourseMember.course_id == course_id
            )
            .first()
        )

        return member.role if member else None

    def get_memberships_by_user(self, user_id: str, role: str = None):
        query = self.db.query(CourseMember).filter(CourseMember.user_id == user_id)

        if role:
            query = query.filter(CourseMember.role == role)

        return query.all()
    

    def count_students(self, course_id):
        return (
            self.db.query(CourseMember)
            .filter(
                CourseMember.course_id == course_id,
                CourseMember.role == "student"
            )
            .count()
        )
