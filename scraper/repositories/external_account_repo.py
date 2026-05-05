from models.external_account_model import ExternalAccount

class ExternalAccountRepository:
    def __init__(self, db):
        self.db = db

    def get_by_user_and_source(self, user_id, source):
        return self.db.query(ExternalAccount)\
            .filter_by(user_id=user_id, source_name=source)\
            .first()

    def create(self, data):
        acc = ExternalAccount(**data)
        self.db.add(acc)
        self.db.commit()
        return acc

    def update(self, acc, data):
        for k, v in data.items():
            setattr(acc, k, v)
        self.db.commit()
        return acc