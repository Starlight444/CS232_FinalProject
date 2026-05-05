from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from uuid import UUID
from database import get_db

from repositories.course_repository import CourseRepository
from repositories.announcement_repository import AnnouncementRepository
from repositories.external_announcement_repository import ExternalAnnouncementRepository

from services.announcement_service import AnnouncementService

from dependencies import get_current_user_id
from config import Settings


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
    return {
        "success": True,
        "data": announcements
    }

def _serialize(a) -> dict:
    author_name = None

    if hasattr(a, "user") and a.user:
        author_name = f"{a.user.first_name} {a.user.last_name}"

    return {
        "announcement_id": str(a.announcement_id),
        "title": a.title,
        "content": a.content,
        "created_at": a.created_at.isoformat(),
        "updated_at": a.updated_at.isoformat() if a.updated_at else None,
        "created_by": str(a.created_by),
        "course_id": str(a.course_id),
        "author_name": author_name
    }


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