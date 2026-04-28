class MockAnnouncementScraper:

    def __init__(self, external_announcement_repo):
        self.external_announcement_repo = external_announcement_repo

    def fetch_announcements(self, user_id=None, **kwargs):

        data = self.external_announcement_repo.get_by_user(user_id)

        result = []

        for item in data:
            result.append({
                "source_name": item.source_name,
                "course_name": item.external_course_name,
                "course_link": item.external_course_url,
                "title": item.title,
                "link": item.external_link,
                "author": item.author,
                "date": item.created_at
            })

        return result