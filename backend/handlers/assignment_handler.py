from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from database import get_db

from repositories.assignment_repository import AssignmentRepository
from repositories.course_member_repository import CourseMemberRepository

from services.assignment_service import AssignmentService

router = APIRouter(prefix="/assignments")

class CreateAssignmentRequest(BaseModel):
    title: str
    description: str
    due_date: datetime
    max_score: int
    course_id: UUID
    created_by: UUID
    allowed_file_types: str = "pdf,docx"

@router.post("/")
def create_assignment(
    request: CreateAssignmentRequest,
    db: Session = Depends(get_db)
):
    repo = AssignmentRepository(db)
    member_repo = CourseMemberRepository(db)
    service = AssignmentService(repo, member_repo)

    assignment = service.create_assignment(
        request.title,
        request.description,
        request.due_date,
        request.max_score,
        request.course_id,
        request.created_by,
        request.allowed_file_types
        )

    return {
        "success": True,
        "data": {
            "assignment_id": str(assignment.assignment_id),
            "title": assignment.title,
            "description": assignment.description,
            "due_date": assignment.due_date,
            "max_score": assignment.max_score,
            "course_id": str(assignment.course_id),
            "created_by": str(assignment.created_by),
            "status": assignment.status,
            "allowed_file_types": assignment.allowed_file_types
        }
    }

@router.get("/{course_id}")
def get_assignments(
    course_id: UUID,
    db: Session = Depends(get_db)
):

    repo = AssignmentRepository(db)
    member_repo = CourseMemberRepository(db)
    service = AssignmentService(repo, member_repo)
    assignments = service.get_assignments(course_id)

    return {
        "success": True,
        "data": assignments
    }