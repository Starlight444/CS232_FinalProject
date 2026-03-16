from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from database import Base

class Assignment(Base):

    __tablename__ = "assignments"

    assignment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String)
    description = Column(Text)

    due_date = Column(DateTime)

    max_score = Column(Integer)

    course_id = Column(UUID)
    created_by = Column(UUID)

    status = Column(String)

    allowed_file_types = Column(String, default="pdf,docx")
    created_at = Column(DateTime, default=datetime.utcnow)