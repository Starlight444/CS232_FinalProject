import uuid
from sqlalchemy import Column, String, Text, UUID
from pydantic import BaseModel, Field
from database import Base

# --- SQLAlchemy Model (Database) ---
class Course(Base):
    __tablename__ = "courses"
    course_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_code = Column(String(20), unique=True, index=True, nullable=False)
    course_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

# --- Pydantic Schemas (API) ---
class CourseCreate(BaseModel):
    course_code: str = Field(..., example="CS232")
    course_name: str = Field(..., example="Database Systems")
    description: str | None = Field(None, example="SQL and Relational DBs")

class CourseResponse(CourseCreate):
    course_id: uuid.UUID
    class Config:
        from_attributes = True