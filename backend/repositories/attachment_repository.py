from models.attachment_model import Attachment


class AttachmentRepository:

    def __init__(self, db):
        self.db = db

    def create(self, attachment):

        self.db.add(attachment)
        self.db.commit()
        self.db.refresh(attachment)

        return attachment

    def get_by_assignment(self, assignment_id):

        return (
            self.db.query(Attachment)
            .filter(Attachment.assignment_id == assignment_id)
            .all()
        )

    def get_by_submission(self, submission_id):

        return (
            self.db.query(Attachment)
            .filter(Attachment.submission_id == submission_id)
            .all()
        )