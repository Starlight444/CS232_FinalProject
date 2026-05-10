# ===================================
# scrape Assignments from Course web
# ===================================

import requests
from bs4 import BeautifulSoup

class AssignmentScraper:

    source_name = "Course web"

    def __init__(self, base_url="https://courses.cs.tu.ac.th"):
        self.base_url = base_url
        self.login_url = f"{self.base_url}/login/index.php"
        self.session = requests.Session()

    # log in เข้า Course web 
    def login(self, username, password):
        res = self.session.get(self.login_url)
        soup = BeautifulSoup(res.text, "html.parser")

        token_input = soup.find("input", {"name": "logintoken"})
        token = token_input["value"] if token_input else ""

        payload = {
            "username": username,
            "password": password,
        }

        if token:
            payload["logintoken"] = token

        res = self.session.post(self.login_url, data=payload)

        if "login" in res.url:
            raise Exception("Login failed")

        print(f"External login success: {self.source_name}")

    # ดึง course
    def get_courses(self):
        res = self.session.get(self.base_url)
        soup = BeautifulSoup(res.text, "html.parser")

        courses = []
        seen = set()

        for a in soup.find_all("a", href=True):
            href = a["href"]

            if "course/view.php" in href and href not in seen:
                seen.add(href)

                name = a.text.strip()
                if name:
                    courses.append((name, href))

        return courses

    # ดึง assignments (กล่องส่งการบ้าน)
    def get_assignments(self, course_link):
        res = self.session.get(course_link)
        soup = BeautifulSoup(res.text, "html.parser")

        assignments = []
        seen = set()

        for a in soup.find_all("a", href=True):
            href = a["href"]

            if "/mod/assign/view.php" in href and href not in seen:
                seen.add(href)

                name = a.text.strip()
                if name:
                    assignments.append((name, href))

        return assignments

    # ดึงรายละเอียด assignment
    def get_assignment_detail(self, assign_link):
        res = self.session.get(assign_link)
        soup = BeautifulSoup(res.text, "html.parser")

        data = {}

        tbody = soup.find("tbody")

        if not tbody:
            print("Table not found:", assign_link)
            return data

        for row in tbody.find_all("tr"):
            cols = row.find_all("td")

            if len(cols) >= 2:
                key = cols[0].get_text(strip=True)
                val = cols[1].get_text(strip=True)

                data[key] = val

        return data

    # MAIN FLOW
    def fetch_assignments(self, username, password):
        self.login(username, password)

        result = []

        courses = self.get_courses()

        for course_name, course_link in courses:
            assignments = self.get_assignments(course_link)

            for assign_name, assign_link in assignments:
                detail = self.get_assignment_detail(assign_link)

                result.append({
                    "source_name": self.source_name,
                    "external_course_name": course_name,
                    "external_course_url": course_link,
                    "title": assign_name,
                    "external_link": assign_link,
                    "submission_status": detail.get("Submission status"),
                    "grading_status": detail.get("Grading status"),
                    "due_date": detail.get("Due date"),
                    "time_remaining": detail.get("Time remaining"),
                    "last_modified": detail.get("Last modified"),
                    "file_submission": detail.get("File submissions")
                })

        return result