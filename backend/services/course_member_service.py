from repositories.course_member_repository import CourseMemberRepository


class CourseMemberService:
    def __init__(self, db):
        self.course_member_repository = CourseMemberRepository(db)

    def get_members_by_course(self, course_id: str):
        return self.course_member_repository.get_members_by_course(course_id)

    def get_role(self, user_id: str, course_id: str):
        return self.course_member_repository.get_role(user_id, course_id)

    def get_memberships_by_user(self, user_id: str, role: str = None):
        return self.course_member_repository.get_memberships_by_user(user_id, role)
