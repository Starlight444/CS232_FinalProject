from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from database import Base


class Attachment(Base):
    
    __tablename__ = "attachments"

    attachment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    assignment_id = Column(UUID, nullable=True)
    submission_id = Column(UUID, nullable=True)

    file_name = Column(String)
    file_url = Column(String)
    file_type = Column(String)

    uploaded_at = Column(DateTime, default=datetime.utcnow)