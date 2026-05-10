# ===================================
# scrape Announcements from TU Moodle
# ===================================

from playwright.sync_api import sync_playwright

BASE_URL = "https://moodle.tu.ac.th/"

class AnnouncementScraper:

    source_name = "TU moodle"

    # log in เข้า moodle
    def try_login(self, page, username, password):
        page.goto(f"{BASE_URL}/login/index.php")
        page.fill('input[name="username"]', username)
        page.fill('input[name="password"]', password)
        page.click('button[type="submit"]')
        page.wait_for_load_state("networkidle")

    # หา announcement ใน course
    def get_forum_links(self, page, course_link):
        page.goto(course_link)
        page.wait_for_selector('a[href*="/mod/forum/view.php"]')

        forums = page.locator('a[href*="/mod/forum/view.php"]')

        seen = set()
        result = []

        for i in range(forums.count()):
            el = forums.nth(i)

            href = el.get_attribute("href")

            if not href or href in seen:
                continue

            seen.add(href)

            name = el.inner_text().strip()

            result.append((name, href))

        return result

    # ดึงรายการ announcement
    def get_announcements(self, page, forum_link):
        page.goto(forum_link)
        page.wait_for_selector("tr.discussion")

        rows = page.locator("tr.discussion")
        results = []

        for i in range(rows.count()):
            row = rows.nth(i)

            # title + link (แก้ใหม่)
            th = row.locator("th.topic")

            title = ""
            link = ""

            if th.count() > 0:
                a = th.locator("a")

                if a.count() > 0:
                    link = a.first.get_attribute("href")

                    # เอา title หรือ aria-label
                    title = (
                        a.first.get_attribute("title")
                        or a.first.get_attribute("aria-label")
                        or a.first.inner_text().strip()
                    )

            # td (author, date)
            tds = row.locator("td.align-middle")

            author = ""
            date = ""

            if tds.count() >= 2:
                raw = tds.nth(1).inner_text().strip()

                parts = raw.split("\n")

                if len(parts) == 2:
                    author = parts[0].strip()
                    date = parts[1].strip()
                else:
                    # fallback
                    author = tds.nth(0).inner_text().strip()
                    date = raw

            results.append({
                "title": title,
                "link": link,
                "author": author,
                "date": date
            })

        return results

    # MAIN FLOW
    def fetch_announcements(self, username, password):

        result = []

        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            self.try_login(page, username, password)

            print(f"External login success: {self.source_name}")

            # เข้า courses
            page.goto(f"{BASE_URL}/my/courses.php")
            page.wait_for_load_state("networkidle")
            page.wait_for_selector('a[href*="course/view.php"]')

            # ดึง courses
            courses_elements = page.locator('a[href*="course/view.php"]')

            courses = []
            seen = set()

            for i in range(courses_elements.count()):
                el = courses_elements.nth(i)
                href = el.get_attribute("href")

                if not href or href in seen:
                    continue
                seen.add(href)

                # หาชื่อ course
                multiline = el.locator('span.multiline')
                name = (
                    multiline.first.get_attribute("title")
                    if multiline.count() > 0
                    else el.inner_text().strip()
                )

                # เพิ่ม course name & course link
                courses.append((name, href))

            # เข้า course → หา forum
            for course_name, course_link in courses:
                forums = self.get_forum_links(page, course_link)

                for forum_name, forum_link in forums:
                    posts = self.get_announcements(page, forum_link)

                    for post in posts:
                        result.append({
                            "source_name": self.source_name,
                            "external_course_name": course_name,
                            "external_course_url": course_link,
                            "title": post["title"],
                            "external_link": post["link"],
                            "author": post["author"],
                            "created_at": post["date"]
                        })

            browser.close()

        return result