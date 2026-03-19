from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
from config import settings

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
        
        # generate JWT token
        payload = {
            "user_id":    str(user.user_id),
            "email":      user.email,     
            "first_name": user.first_name,  
            "last_name":  user.last_name,    
            "exp":        datetime.utcnow() + timedelta(hours=24)
        }
        token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
        return user, token