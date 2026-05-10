from sqlalchemy import Column, String, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy import Date
import uuid
from database import Base

class ExternalAnnouncement(Base):
    __tablename__ = "external_announcements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), nullable=False)
    source_name = Column(String(100), nullable=False)
    external_course_code = Column(String(10))
    external_course_name = Column(Text)
    external_course_url = Column(Text)
    title = Column(Text, nullable=False)
    external_link = Column(Text)
    author = Column(Text)
    created_at = Column(Date)

    __table_args__ = (
        UniqueConstraint("user_id", "source_name", "external_link", name="unique_ext_announce"),
    )