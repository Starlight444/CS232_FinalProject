from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from database import get_db

from repositories.assignment_repository import AssignmentRepository
from repositories.course_member_repository import CourseMemberRepository
from repositories.external_account_repository import ExternalAccountRepository
from repositories.external_assignment_repository import ExternalAssignmentRepository
from repositories.external_announcement_repository import ExternalAnnouncementRepository

from scrapers.assignment_scraper import AssignmentScraper
from scrapers.announcement_scraper import AnnouncementScraper
from scrapers.mock_assignment_scraper import MockAssignmentScraper
from scrapers.mock_announcement_scraper import MockAnnouncementScraper

from services.assignment_service import AssignmentService
from services.sync_service import SyncService
from crypto import Crypto
from config import Settings

router = APIRouter(prefix="/assignments", tags=["assignments"])

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

@router.post("/sync")
def sync_assignments(user_id: str, db: Session = Depends(get_db)):

    external_repo = ExternalAccountRepository(db)
    external_assignment_repo = ExternalAssignmentRepository(db)
    external_announcement_repo = ExternalAnnouncementRepository(db)

    real_assignment_scraper = AssignmentScraper()
    real_announcement_scraper = AnnouncementScraper()
    mock_assignment_scraper = MockAssignmentScraper(external_assignment_repo)
    mock_announcement_scraper = MockAnnouncementScraper(external_announcement_repo)

    crypto = Crypto()

    service = SyncService(
        external_repo,
        external_assignment_repo,
        external_announcement_repo,
        real_assignment_scraper,
        real_announcement_scraper,
        mock_assignment_scraper,
        mock_announcement_scraper,
        crypto
    )

    settings = Settings()

    mode = "mock" if settings.USE_MOCK else "real"

    data = service.sync_assignments(user_id=user_id, mode=mode)

    return {
        "success": True,
        "mode": mode,
        "data": data
    }

@router.get("/external")
def get_external_assignments(user_id: str, db: Session = Depends(get_db)):
    
    repo = ExternalAssignmentRepository(db)
    data = repo.get_by_user(user_id)

    result = []

    for item in data:
        result.append({
            "id": str(item.id),
            "source_name": item.source_name,
            "course_name": item.external_course_name,
            "course_link": item.external_course_url,
            "title": item.title,
            "link": item.external_link,
            "submission_status": item.submission_status,
            "grading_status": item.grading_status,
            "due_date": item.due_date,
            "time_remaining": item.time_remaining,
            "last_modified": item.last_modified,
            "file_submission": item.file_submission,
        })

    return result