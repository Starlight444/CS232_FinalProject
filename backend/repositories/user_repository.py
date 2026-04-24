from models.user_model import User
from models.course_member_model import CourseMember

class UserRepository:
    def __init__(self, db):
        self.db = db
    
    def get_by_email(self, email):
        return (
            self.db.query(User)
            .filter(User.email == email)
            .first()
        )
    
    def get_by_id(self, user_id):
        return (
            self.db.query(User)
            .filter(User.user_id == user_id)
            .first()
        )
    
    def get_role(self, user_id):
        member = (
            self.db.query(CourseMember)
            .filter(CourseMember.user_id == user_id)
            .first()
        )
        return member.role if member else None