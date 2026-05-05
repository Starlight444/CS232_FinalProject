from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from dependencies import get_current_user_id
from database import get_db

from repositories.course_repository import CourseRepository
from repositories.assignment_repository import AssignmentRepository
from repositories.course_member_repository import CourseMemberRepository
from repositories.external_assignment_repository import ExternalAssignmentRepository

from services.assignment_service import AssignmentService

router = APIRouter(prefix="/assignments", tags=["assignments"])

class CreateAssignmentRequest(BaseModel):
    title: str
    description: str
    due_date: datetime
    max_score: int
    course_id: UUID
    created_by: UUID
    allowed_file_types: str = "pdf,docx"

class UpdateAssignmentRequest(BaseModel):
    title: str
    description: str
    due_date: datetime
    max_score: int
    course_id: UUID
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

@router.get("/detail/{assignment_id}")
def get_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db)
):
    repo = AssignmentRepository(db)
    member_repo = CourseMemberRepository(db)
    service = AssignmentService(repo, member_repo)

    assignment = service.get_assignment(assignment_id)

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return {
        "success": True,
        "data": assignment
    }

@router.put("/{assignment_id}")
def update_assignment(
    assignment_id: UUID,
    request: UpdateAssignmentRequest,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    repo = AssignmentRepository(db)
    member_repo = CourseMemberRepository(db)
    service = AssignmentService(repo, member_repo)

    try:
        assignment = service.update_assignment(
            assignment_id,
            request.title,
            request.description,
            request.due_date,
            request.max_score,
            request.course_id,
            UUID(user_id),
            request.allowed_file_types
        )
    except Exception as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

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

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id)
):
    repo = AssignmentRepository(db)
    member_repo = CourseMemberRepository(db)
    service = AssignmentService(repo, member_repo)

    try:
        assignment = service.delete_assignment(assignment_id, UUID(user_id))
    except Exception as exc:
        raise HTTPException(status_code=403, detail=str(exc))

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    return {
        "success": True,
        "message": "Assignment deleted successfully"
    }


@router.get("/all")
def get_all_assignments(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id),):

    repo = AssignmentRepository(db)
    member_repo = CourseMemberRepository(db)
    external_repo = ExternalAssignmentRepository(db)
    course_repo = CourseRepository(db)

    service = AssignmentService(repo, member_repo)

    data = service.get_all_assignments(
        user_id=user_id,
        course_repo=course_repo,
        external_repo=external_repo
    )

    return {
        "success": True,
        "data": data
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
