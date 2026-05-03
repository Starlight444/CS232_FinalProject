from sqlalchemy import func, select

from models.attachment_model import Attachment
from models.assignment_model import Assignment
from models.submission_model import Submission


class AssignmentRepository:

    def __init__(self, db):
        self.db = db

    def create(self, assignment):

        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)

        return assignment

    def get_by_course(self, course_id):
        
        return (
            self.db.query(Assignment)
            .filter(Assignment.course_id == course_id)
            .all()
        )

    def get_assignments_with_count(self, course_id):
        return (
            self.db.query(
                Assignment,
                func.count(Submission.submission_id).label("submit_count")
            )
            .outerjoin(
                Submission,
                Submission.assignment_id == Assignment.assignment_id
            )
            .filter(Assignment.course_id == course_id)
            .group_by(Assignment.assignment_id)
            .all()
        )
    
    def get_assignment_with_count_by_id(self, assignment_id):
        return (
            self.db.query(
                Assignment,
                func.count(Submission.submission_id).label("submit_count")
            )
            .outerjoin(
                Submission,
                Submission.assignment_id == Assignment.assignment_id
            )
            .filter(Assignment.assignment_id == assignment_id)
            .group_by(Assignment.assignment_id)
            .first()
        )

    def get_by_id(self, assignment_id):
        return (
            self.db.query(Assignment)
            .filter(Assignment.assignment_id == assignment_id)
            .first()
        )

    def update(self, assignment):
        self.db.commit()
        self.db.refresh(assignment)
        return assignment

    def delete(self, assignment_id):
        assignment = self.get_by_id(assignment_id)
        if not assignment:
            return None

        submission_ids = select(Submission.submission_id).where(
            Submission.assignment_id == assignment_id
        )

        self.db.query(Attachment).filter(
            Attachment.assignment_id == assignment_id
        ).delete(synchronize_session=False)

        self.db.query(Attachment).filter(
            Attachment.submission_id.in_(submission_ids)
        ).delete(synchronize_session=False)

        self.db.query(Submission).filter(
            Submission.assignment_id == assignment_id
        ).delete(synchronize_session=False)

        self.db.delete(assignment)
        self.db.commit()
        return assignment
    
    def count_assignments(self, course_id):
        return (
            self.db.query(Assignment)
            .filter(Assignment.course_id == course_id)
            .count()
        )
