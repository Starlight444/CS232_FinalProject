from models.submission_model import Submission
from models.attachment_model import Attachment
from datetime import datetime
import uuid
import os


class SubmissionService:

    def __init__(self, repo, member_repo, attachment_repo, storage):

        self.repo = repo
        self.member_repo = member_repo
        self.attachment_repo = attachment_repo
        self.storage = storage

    def submit_assignment(self, assignment_id, student_id, course_id, files):

        role = self.member_repo.get_role(student_id, course_id)

        if not role or role != "student":
            raise Exception("Only students can submit assignments")

        existing = self.repo.find_submission(assignment_id, student_id)

        if existing:
            existing.status = "submitted"
            self.repo.update(existing)
            submission_id = existing.submission_id
            self.attachment_repo.delete_by_submission(submission_id)
        else:
            submission = Submission(
                assignment_id=assignment_id,
                student_id=student_id,
                status="submitted"
            )
            created = self.repo.create(submission)
            submission_id = created.submission_id

        attachments = []

        for file in files:
            filename = file.filename
            filetype = filename.split(".")[-1]

            if self.storage:
                key = f"submissions/{assignment_id}/{student_id}/{uuid.uuid4()}"
                file_url = self.storage.upload_file(file.file, key)

            else:
                os.makedirs("uploads/submissions", exist_ok=True)

                unique_name = f"{uuid.uuid4()}_{filename}"
                file_path = f"uploads/submissions/{unique_name}"

                with open(file_path, "wb") as f:
                    file.file.seek(0)
                    f.write(file.file.read())

                file_url = file_path

            attachment = Attachment(
                submission_id=submission_id,
                file_name=filename,
                file_url=file_url,
                file_type=filetype
            )

            created_attachment = self.attachment_repo.create(attachment)
            attachments.append({
                "attachment_id": str(created_attachment.attachment_id),
                "file_name": created_attachment.file_name,
                "file_url": created_attachment.file_url,
                "file_type": created_attachment.file_type
            })

        return {
            "submission_id": str(submission_id),
            "attachments": attachments
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
        submission.graded_at = datetime.utcnow()


        updated = self.repo.update(submission)

        return {
            "submission_id": updated.submission_id,
            "status": updated.status,
            "score": updated.score
        }
