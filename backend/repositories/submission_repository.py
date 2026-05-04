from sqlalchemy import func
from models.submission_model import Submission
from models.user_model import User
from models.attachment_model import Attachment
from models.assignment_model import Assignment


class SubmissionRepository:

    def __init__(self, db):
        self.db = db

    def create(self, submission):

        self.db.add(submission)
        self.db.commit()
        self.db.refresh(submission)

        return submission

    def get_by_assignment(self, assignment_id):

        results = (
            self.db.query(Submission, User, Attachment)
            .join(User, Submission.student_id == User.user_id)
            .outerjoin(
                Attachment,
                Submission.submission_id == Attachment.submission_id
            )
            .filter(Submission.assignment_id == assignment_id)
            .all()
        )

        submission_map = {}

        for submission, user, attachment in results:

            sid = submission.submission_id

            if sid not in submission_map:
                submission_map[sid] = {
                    "submission_id": sid,
                    "user_id": submission.student_id,
                    "student_code": user.student_id,
                    "student_name": f"{user.first_name} {user.last_name}",
                    "submitted_at": submission.submitted_at,
                    "status": submission.status,
                    "score": submission.score,
                    "feedback": submission.feedback,
                    "attachments": []
                }
            if attachment:
                submission_map[sid]["attachments"].append({
                    "file_name": attachment.file_name,
                    "file_url": attachment.file_url,
                    "file_type": attachment.file_type
                })

        return list(submission_map.values())
    
    def get_by_id(self, submission_id):

        return (
            self.db.query(Submission)
            .filter(Submission.submission_id == submission_id)
            .first()
        )

    def update(self, submission):

        self.db.commit()
        self.db.refresh(submission)

        return submission
    
    def count_submitted_students(self, course_id):
        return (
            self.db.query(func.count(func.distinct(Submission.student_id)))
            .join(Assignment, Submission.assignment_id == Assignment.assignment_id)
            .filter(Assignment.course_id == course_id)
            .scalar()
        )
    
    def find_submission(self, assignment_id, student_id):
        return (
            self.db.query(Submission)
            .filter(
                Submission.assignment_id == assignment_id,
                Submission.student_id == student_id
            )
            .order_by(Submission.submitted_at.desc())
            .first()
        )
    
    def get_by_assignment_and_student(self, assignment_id, student_id):
        submission = (
            self.db.query(Submission)
            .filter(
                Submission.assignment_id == assignment_id,
                Submission.student_id == student_id
            )
            .order_by(Submission.submitted_at.desc())
            .first()
        )
        if not submission:
            return {"status": "not_submitted"}

        attachments = (
            self.db.query(Attachment)
            .filter(Attachment.submission_id == submission.submission_id)
            .all()
        )
        return {
            "submission_id": submission.submission_id,
            "status": submission.status,
            "submitted_at": submission.submitted_at,
            "graded_at": submission.graded_at,
            "score": submission.score,
            "feedback": submission.feedback,
            "attachments": [a.file_url for a in attachments]
        }
