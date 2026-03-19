import uuid
from sqlalchemy import Column, ForeignKey, Enum, UUID
from pydantic import BaseModel
from database import Base

class CourseMember(Base):
    __tablename__ = "course_members"
    member_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    role = Column(Enum('teacher', 'ta', 'student', name='role_enum'), nullable=False)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.course_id"), nullable=False)

class MemberResponse(BaseModel):
    member_id: uuid.UUID
    role: str
    user_id: uuid.UUID
    course_id: uuid.UUID
    class Config:
        from_attributes = True

