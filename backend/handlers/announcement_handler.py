from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from database import get_db

from repositories.course_repository import CourseRepository
from repositories.announcement_repository import AnnouncementRepository
from repositories.external_account_repository import ExternalAccountRepository
from repositories.external_assignment_repository import ExternalAssignmentRepository
from repositories.external_announcement_repository import ExternalAnnouncementRepository

from services.announcement_service import AnnouncementService
from services.sync_service import SyncService

from scrapers.assignment_scraper import AssignmentScraper
from scrapers.announcement_scraper import AnnouncementScraper
from scrapers.mock_assignment_scraper import MockAssignmentScraper
from scrapers.mock_announcement_scraper import MockAnnouncementScraper

from dependencies import get_current_user_id
from config import Settings
from crypto import Crypto

router = APIRouter(prefix="/announcements", tags=["announcements"])

class CreateAnnouncementRequest(BaseModel):
    title:     str
    content:   str
    course_id: str

class UpdateAnnouncementRequest(BaseModel):
    title:   str
    content: str

@router.post("")
def create_announcement(
    request: CreateAnnouncementRequest,
    db: Session = Depends(get_db),
    requester_id: str = Depends(get_current_user_id),
):
    service = AnnouncementService(AnnouncementRepository(db))
    try:
        announcement = service.create_announcement(
            title=request.title,
            content=request.content,
            course_id=request.course_id,
            requester_id=requester_id,
        )
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))

    return {"success": True, "data": _serialize(announcement)}

@router.get("/course/{course_id}")
def get_by_course(course_id: str, db: Session = Depends(get_db)):
    service = AnnouncementService(AnnouncementRepository(db))
    announcements = service.get_by_course(course_id)
    return {"success": True, "data": [_serialize(a) for a in announcements]}

def _serialize(a) -> dict:
    return {
        "announcement_id": str(a.announcement_id),
        "title":           a.title,
        "content":         a.content,
        "created_at":      a.created_at.isoformat(),
        "updated_at":      a.updated_at.isoformat() if a.updated_at else None,
        "created_by":      str(a.created_by),
        "course_id":       str(a.course_id),
    }

@router.post("/sync")
def sync_announcements(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id),):
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

    data = service.sync_announcements(user_id=user_id, mode=mode)

    return {
        "success": True,
        "mode": mode,
        "data": data
    }

@router.get("/external")
def get_external_announcements(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id),):

    repo = ExternalAnnouncementRepository(db)
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
            "author": item.author,
            "date": item.created_at,
        })

    return result

@router.get("/all")
def get_all_announcements(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id),):

    ann_repo = AnnouncementRepository(db)
    ext_repo = ExternalAnnouncementRepository(db)
    course_repo = CourseRepository(db)

    service = AnnouncementService(ann_repo)

    data = service.get_all_announcements(
        user_id=user_id,
        external_repo=ext_repo,
        course_repo=course_repo
    )

    return {
        "success": True,
        "data": data
    }

@router.get("/{announcement_id}")
def get_detail(announcement_id: UUID, db: Session = Depends(get_db)):
    service = AnnouncementService(AnnouncementRepository(db))
    try:
        announcement = service.get_by_id(announcement_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    return {"success": True, "data": _serialize(announcement)}

@router.put("/{announcement_id}")
def update_announcement(
    announcement_id: UUID,
    request: UpdateAnnouncementRequest,
    db: Session = Depends(get_db),
    requester_id: str = Depends(get_current_user_id),
):
    service = AnnouncementService(AnnouncementRepository(db))
    try:
        announcement = service.update_announcement(
            announcement_id=announcement_id,
            title=request.title,
            content=request.content,
            requester_id=requester_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=403, detail=str(e))
    return {"success": True, "data": _serialize(announcement)}