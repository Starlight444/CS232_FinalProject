from sqlalchemy import Column, String, ForeignKey, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from database import Base

class ExternalAccount(Base):
    __tablename__ = "external_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    user_id = Column(UUID(as_uuid=True),ForeignKey("users.user_id", ondelete="CASCADE"),nullable=False)
    is_mock = Column(Boolean, nullable=True)
    source_name = Column(String(50), nullable=False)
    external_username = Column(String(255), nullable=False)
    external_password_encrypted = Column(Text, nullable=False)
    is_connected = Column(Boolean, default=True)
    last_synced_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())