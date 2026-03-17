from models.user_model import User

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