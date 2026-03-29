from sqlalchemy import func

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
    
    def count_assignments(self, course_id):
        return (
            self.db.query(Assignment)
            .filter(Assignment.course_id == course_id)
            .count()
        )