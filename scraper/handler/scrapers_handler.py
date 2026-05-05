from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user_id

from repositories.external_account_repo import ExternalAccountRepository
from repositories.external_assignment_repo import ExternalAssignmentRepository
from repositories.external_announcement_repo import ExternalAnnouncementRepository

from scrapers.assignment_scraper import AssignmentScraper
from scrapers.announcement_scraper import AnnouncementScraper

from service.sync_service import SyncService
from crypto import Crypto
from config import Settings

router = APIRouter(prefix="/sync", tags=["sync"])

# Helper function
def build_sync_service(db):
    external_repo = ExternalAccountRepository(db)
    external_assignment_repo = ExternalAssignmentRepository(db)
    external_announcement_repo = ExternalAnnouncementRepository(db)

    real_assignment_scraper = AssignmentScraper()
    real_announcement_scraper = AnnouncementScraper()

    crypto = Crypto()

    return SyncService(
        external_repo,
        external_assignment_repo,
        external_announcement_repo,
        real_assignment_scraper,
        real_announcement_scraper,
        crypto
    )

# sync & get assignments
@router.post("/assignments")
def sync_assignments(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id),):

    external_repo = ExternalAccountRepository(db)

    account = external_repo.get_by_user_and_source(
        user_id=user_id,
        source="Course web"
    )

    if not account or not account.is_connected:
        raise HTTPException(
            status_code=403,
            detail="External account not connected"
        )
    
    service = build_sync_service(db)

    count = service.sync_assignments(user_id=user_id)

    return {
        "success": True,
        "count": count
    }

# sync & get announcements
@router.post("/announcements")
def sync_announcements(db: Session = Depends(get_db), user_id: str = Depends(get_current_user_id),):

    external_repo = ExternalAccountRepository(db)

    account = external_repo.get_by_user_and_source(
        user_id=user_id,
        source="TU moodle"
    )

    if not account or not account.is_connected:
        raise HTTPException(
            status_code=403,
            detail="External account not connected"
        )
    
    service = build_sync_service(db)
    
    count = service.sync_announcements(user_id=user_id)

    return {
        "success": True,
        "count": count
    }