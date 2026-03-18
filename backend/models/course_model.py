from pydantic import BaseModel
from typing import Optional


class CourseCreate(BaseModel):
    course_code: str
    course_name: str
    description: Optional[str] = None


class CourseResponse(BaseModel):
    course_id: str
    course_code: str
    course_name: str
    description: Optional[str]