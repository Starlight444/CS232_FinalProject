import uuid
from sqlalchemy import Column, String, Text
from sqlalchemy.dialects.postgresql import UUID
from pydantic import BaseModel
from database import Base

# ส่วนของ Database 
class Course(Base):
    __tablename__ = "courses"
    course_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_code = Column(String(20), unique=True, index=True, nullable=False)
    course_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

# ส่วนของ API Response 
class CourseResponse(BaseModel):
    course_id: uuid.UUID
    course_code: str
    course_name: str
    description: str | None = None

    class Config:
        from_attributes = True # จาก DB เป็น JSON 
