from models.attachment_model import Attachment
import uuid


class AttachmentService:

    def __init__(self, repo, storage):

        self.repo = repo
        self.storage = storage


    def upload_assignment_file(self, assignment_id, file):

        filename = file.filename
        filetype = filename.split(".")[-1]

        key = f"assignments/{assignment_id}/{uuid.uuid4()}"

        file_url = self.storage.upload_file(file.file, key)

        attachment = Attachment(
            assignment_id=assignment_id,
            file_name=filename,
            file_url=file_url,
            file_type=filetype
        )

        return self.repo.create(attachment)


    def upload_submission_file(self, submission_id, file):

        filename = file.filename
        filetype = filename.split(".")[-1]

        key = f"submissions/{submission_id}/{uuid.uuid4()}"

        file_url = self.storage.upload_file(file.file, key)

        attachment = Attachment(
            submission_id=submission_id,
            file_name=filename,
            file_url=file_url,
            file_type=filetype
        )

        return self.repo.create(attachment)


    def get_assignment_files(self, assignment_id):

        return self.repo.get_by_assignment(assignment_id)


    def get_submission_files(self, submission_id):

        return self.repo.get_by_submission(submission_id)