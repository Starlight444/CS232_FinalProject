from sqlalchemy import Column, String, DateTime, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
import uuid
from database import Base

class ExternalAssignment(Base):
    __tablename__ = "external_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), nullable=False)
    source_name = Column(String(50), nullable=True)
    external_course_code = Column(String(10))
    external_course_name = Column(Text)
    external_course_url = Column(Text)
    title = Column(Text)
    external_link = Column(Text)
    submission_status = Column(Text)
    grading_status = Column(Text)
    due_date = Column(DateTime)
    time_remaining = Column(Text)
    last_modified = Column(DateTime)
    file_submission = Column(Text)
    raw_data = Column(JSONB)
    created_at = Column(DateTime, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "source_name", "external_link", name="unique_ext_assign"),
    )