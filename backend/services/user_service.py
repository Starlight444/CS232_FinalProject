from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"])

class UserService:
    def __init__(self, repo):
        self.repo = repo
    
    def login(self, email, password):
        # 1. เช็คว่ามี user นี้ไหม
        user = self.repo.get_by_email(email)
        if not user:
            raise Exception("Email not found")
        
        # 2. เช็ค password
        if not pwd_context.verify(password, user.password_hash):
            raise Exception("Invalid password")
        
        return user