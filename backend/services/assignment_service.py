from models.assignment_model import Assignment


class AssignmentService:

    def __init__(self, repo, member_repo):

        self.repo = repo
        self.member_repo = member_repo

    def create_assignment(
        self,
        title,
        description,
        due_date,
        max_score,
        course_id,
        created_by,
        allowed_file_types
    ):

        role = self.member_repo.get_role(created_by, course_id)

        if not role or getattr(role, "value", role) not in ["teacher", "ta"]:
            raise Exception("Only teacher or TA can create assignments")

        assignment = Assignment(
            title=title,
            description=description,
            due_date=due_date,
            max_score=max_score,
            course_id=course_id,
            created_by=created_by,
            allowed_file_types=allowed_file_types
        )

        return self.repo.create(assignment)
    
    def get_assignments(self, course_id):
        rows = self.repo.get_assignments_with_count(course_id)

        return [
            {
                "assignment_id": str(a.assignment_id),
                "title": a.title,
                "description": a.description,
                "due_date": a.due_date,
                "max_score": a.max_score,
                "allowed_file_types": a.allowed_file_types,
                "course_id": str(a.course_id),
                "status": a.status,
                "submit_count": count
            }
            for a, count in rows
        ]
    
    def get_assignment(self, assignment_id):
        row = self.repo.get_assignment_with_count_by_id(assignment_id)

        if not row:
            return None

        a, count = row

        return {
            "assignment_id": str(a.assignment_id),
            "title": a.title,
            "description": a.description,
            "due_date": a.due_date,
            "max_score": a.max_score,
            "allowed_file_types": a.allowed_file_types,
            "course_id": str(a.course_id),
            "status": a.status,
            "submit_count": count
        }
    
    def get_all_assignments(self, user_id, course_repo, external_repo):
        result = []

        # INTERNAL
        courses = course_repo.get_courses_by_user(user_id)

        for c in courses:
            course_id = c["course_id"]

            rows = self.repo.get_assignments_with_count(course_id)

            for a, count in rows:
                result.append({
                    "assignment_id": str(a.assignment_id),
                    "title": a.title,
                    "description": a.description,
                    "due_date": a.due_date,
                    "max_score": a.max_score,
                    "allowed_file_types": a.allowed_file_types,
                    "course_id": str(a.course_id),
                    "status": a.status,
                    "submit_count": count,
                    "is_external": False
                })

        # EXTERNAL
        external_data = external_repo.get_by_user(user_id)

        for e in external_data:

            # map course_code → course_id
            course = course_repo.get_course_by_code(e.external_course_code)

            result.append({
                "assignment_id": str(e.id),
                "title": e.title,
                "due_date": e.due_date,
                "course_id": str(course.course_id) if course else None,
                "status": e.grading_status,

                "course_link": e.external_course_url,
                "box_link": e.external_link,

                "submission_status": e.submission_status,
                "grading_status": e.grading_status,
                "time_remaining": e.time_remaining,
                "last_modified": e.last_modified,
                "file_submission": e.file_submission,

                "is_external": True
            })

        return result