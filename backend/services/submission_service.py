from models.submission_model import Submission
from models.attachment_model import Attachment
import uuid


class SubmissionService:

    def __init__(self, repo, member_repo, attachment_repo, storage):

        self.repo = repo
        self.member_repo = member_repo
        self.attachment_repo = attachment_repo
        self.storage = storage

    def submit_assignment(self, assignment_id, student_id, course_id, file):

        role = self.member_repo.get_role(student_id, course_id)

        if role != "student":
            raise Exception("Only students can submit assignments")

        submission = Submission(
            assignment_id=assignment_id,
            student_id=student_id,
            status="submitted"
        )

        created = self.repo.create(submission)

        key = f"submissions/{assignment_id}/{student_id}/{uuid.uuid4()}"

        file_url = self.storage.upload_file(file.file, key)

        attachment = Attachment(
            submission_id=created.submission_id,
            file_name=file.filename,
            file_url=file_url,
            file_type=file.filename.split(".")[-1]
        )

        self.attachment_repo.create(attachment)

        return {
            "submission_id": created.submission_id,
            "file_url": file_url
        }
    def grade_submission(self, submission_id, grader_id, course_id, score, feedback):

        role = self.member_repo.get_role(grader_id, course_id)

        if role not in ["teacher", "ta"]:
            raise Exception("Only teacher or TA can grade submissions")

        submission = self.repo.get_by_id(submission_id)
        
        if not submission:
            raise Exception("Submission not found")

        submission.score = score
        submission.feedback = feedback
        submission.status = "graded"


        updated = self.repo.update(submission)

        return {
            "submission_id": updated.submission_id,
            "status": updated.status,
            "score": updated.score
        }