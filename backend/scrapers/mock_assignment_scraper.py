class MockAssignmentScraper:

    def __init__(self, external_assignment_repo):
        self.external_assignment_repo = external_assignment_repo

    def fetch_assignments(self, user_id=None, **kwargs):

        data = self.external_assignment_repo.get_by_user(user_id)

        result = []

        for item in data:
            result.append({
                "source_name": item.source_name,
                "course_name": item.external_course_name,
                "course_link": item.external_course_url,
                "title": item.title,
                "link": item.external_link,
                "submission_status": item.submission_status,
                "grading_status": item.grading_status,
                "due_date": item.due_date,
                "time_remaining": item.time_remaining,
                "last_modified": item.last_modified,
                "file_submission": item.file_submission
            })

        return result