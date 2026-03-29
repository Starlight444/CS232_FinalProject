from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from database import Base

class Submission(Base):

    __tablename__ = "submissions"

    submission_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    assignment_id = Column(UUID, nullable=False)
    student_id = Column(UUID, nullable=False)

    submitted_at = Column(DateTime, default=datetime.utcnow)

    status = Column(String, default="submitted")

    score = Column(Integer, nullable=True)
    feedback = Column(String, nullable=True)