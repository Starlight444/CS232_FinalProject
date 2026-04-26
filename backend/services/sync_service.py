from datetime import datetime
from dateutil import parser

class SyncService:

    def __init__(
        self,
        external_repo,
        external_assignment_repo,
        external_announcement_repo,
        real_assignment_scraper,
        real_announcement_scraper,
        mock_assignment_scraper,
        mock_announcement_scraper,
        crypto
    ):
        self.external_repo = external_repo
        self.external_assignment_repo = external_assignment_repo
        self.external_announcement_repo = external_announcement_repo

        self.real_assignment_scraper = real_assignment_scraper
        self.real_announcement_scraper = real_announcement_scraper

        self.mock_assignment_scraper = mock_assignment_scraper
        self.mock_announcement_scraper = mock_announcement_scraper

        self.crypto = crypto

    def parse_date(self, date_str):
        try:
            return parser.parse(date_str)
        except Exception as e:
            print("DATE PARSE ERROR:", date_str, e)
            return None

    def sync_assignments(self, user_id, mode="mock"):
        source_name = "Course web"

        # validate mode
        if mode not in ["mock", "real"]:
            raise ValueError("Invalid mode")

        acc = self.external_repo.get_by_user_and_source(user_id, source_name)

        if not acc or not acc.is_connected:
            raise Exception("External not connected")

        # guard mock user
        if mode == "real" and acc.is_mock:
            raise Exception("Mock user cannot use real mode")

        username = acc.external_username
        password = self.crypto.decrypt(acc.external_password_encrypted)

        # SELECT SCRAPER
        if mode == "mock":
            scraper = self.mock_assignment_scraper
        else:
            scraper = self.real_assignment_scraper

        # SYNC
        self.external_assignment_repo.delete_by_user_and_source(user_id, source_name)

        data = scraper.fetch_assignments(username=username, password=password)

        for item in data:
            item["user_id"] = user_id
            item["source_name"] = source_name

        self.external_assignment_repo.bulk_create(data)

        return data
    
    def sync_announcements(self, user_id, mode="mock"):
        source_name = "TU moodle"

        # validate mode
        if mode not in ["mock", "real"]:
            raise ValueError("Invalid mode")

        acc = self.external_repo.get_by_user_and_source(user_id, source_name)

        if not acc or not acc.is_connected:
            raise Exception("External not connected")
        
        # guard mock user
        if mode == "real" and acc.is_mock:
            raise Exception("Mock user cannot use real mode")

        username = acc.external_username
        password = self.crypto.decrypt(acc.external_password_encrypted)

        # SELECT SCRAPER
        if mode == "mock":
            scraper = self.mock_announcement_scraper
        else:
            scraper = self.real_announcement_scraper

        # SYNC
        self.external_announcement_repo.delete_by_user_and_source(user_id, source_name)

        data = scraper.fetch_announcements(username=username, password=password)
        
        for item in data:
            item["user_id"] = user_id   
            raw_date = item.get("created_at")

            if raw_date:
                parts = raw_date.split("\n")

                if len(parts) == 2:
                    author = parts[0].strip()
                    date_str = parts[1].strip()
                    item["author"] = author
                else:
                    date_str = raw_date.strip()

                parsed_date = self.parse_date(date_str)

                if isinstance(parsed_date, datetime):
                    item["created_at"] = parsed_date
                else:
                    print("INVALID DATE:", raw_date)
                    item["created_at"] = None
            else:
                item["created_at"] = None

        self.external_announcement_repo.bulk_create(data)

        return data