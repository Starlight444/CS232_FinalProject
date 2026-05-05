from models.external_announcement_model import ExternalAnnouncement

class ExternalAnnouncementRepository:

    def __init__(self, db):
        self.db = db

    def bulk_create(self, data_list):
        objs = [ExternalAnnouncement(**data) for data in data_list]
        self.db.add_all(objs)
        self.db.commit()
        return objs

    def delete_by_user_and_source(self, user_id, source):
        self.db.query(ExternalAnnouncement)\
            .filter_by(user_id=user_id, source_name=source)\
            .delete()
        self.db.commit()

    def get_by_user(self, user_id):
        return self.db.query(ExternalAnnouncement)\
            .filter_by(user_id=user_id)\
            .all()