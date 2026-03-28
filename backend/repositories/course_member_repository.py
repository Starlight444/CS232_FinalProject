from models.course_member_model import CourseMember


class CourseMemberRepository:
    def __init__(self, db):
        self.db = db

    def get_members_by_course(self, course_id: str):
        return self.db.query(CourseMember).filter(CourseMember.course_id == course_id).all()

    def get_role(self, user_id: str, course_id: str):
        return (
            self.db.query(CourseMember)
            .filter(
                CourseMember.user_id == user_id,
                CourseMember.course_id == course_id
            )
            .first()
        )

    def get_memberships_by_user(self, user_id: str, role: str = None):
        query = self.db.query(CourseMember).filter(CourseMember.user_id == user_id)

        if role:
            query = query.filter(CourseMember.role == role)

        return query.all()