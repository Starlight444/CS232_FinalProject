from datetime import datetime
# from datetime import date
from dateutil import parser
import re

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
            date_str = date_str.replace(".", "")
            return datetime.strptime(date_str, "%d %b %Y").date()
        except Exception as e:
            print("DATE PARSE ERROR:", date_str, e)
            return None
        
    def parse_due_date(self, date_str):
        if not date_str or date_str.strip() == "-":
            return None
        try:
            return parser.parse(date_str)
        except Exception as e:
            print("DUE DATE PARSE ERROR:", date_str, e)
            return None
        
    def clean_filename(self, file_str):
        if not file_str:
            return None

        cleaned = re.sub(r"\d{1,2}\s+[A-Za-z]+\s+\d{4}.*", "", file_str)

        return cleaned.strip()

    def extract_course_code(self, full_name: str):
        matches = re.findall(r"[A-Z]{2,3}\d{3}", full_name)
        if not matches:
            return None
        # เลือก course code อันที่สอง
        return matches[-1]

    def clean_title(self, title: str):
        return re.sub(r"\s*Assignment\s*$", "", title, flags=re.IGNORECASE)

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

            # formating due_date
            raw_due = item.get("due_date")
            if raw_due:
                parsed = self.parse_due_date(raw_due)

                if parsed:
                    item["due_date"] = parsed
                else:
                    item["due_date"] = None

            # formating last_modified
            raw_last_modified = item.get("last_modified")
            if raw_last_modified:
                parsed = self.parse_due_date(raw_last_modified)
                if parsed:
                    item["last_modified"] = parsed
                else:
                    item["last_modified"] = None
            else:
                item["last_modified"] = None

            # clean file_submission name
            raw_file = item.get("file_submission")
            if raw_file:
                item["file_submission"] = self.clean_filename(raw_file)
            else:
                item["file_submission"] = None

            # enforce rule: none file_submission -> none last_modified
            if not item.get("file_submission"):
                item["last_modified"] = None

            # extract course_code from course_name
            full_name = item.get("external_course_name", "")
            item["external_course_code"] = self.extract_course_code(full_name)

            # clean title
            if "title" in item:
                item["title"] = self.clean_title(item["title"])

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

                # formating date
                parsed_date = self.parse_date(date_str)
                if parsed_date:
                    item["created_at"] = parsed_date
                else:
                    item["created_at"] = None
            else:
                item["created_at"] = None

            # extract course_code from course_name
            full_name = item.get("external_course_name", "")
            item["external_course_code"] = self.extract_course_code(full_name)

        self.external_announcement_repo.bulk_create(data)

        return data