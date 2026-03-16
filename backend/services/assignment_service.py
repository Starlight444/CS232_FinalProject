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

        if role not in ["teacher", "ta"]:
            raise Exception("Only teacher or TA can create assignments")

        assignment = Assignment(
            title=title,
            description=description,
            due_date=due_date,
            max_score=max_score,
            course_id=course_id,
            created_by=created_by,
            status="published",
            allowed_file_types=allowed_file_types
        )

        return self.repo.create(assignment)

    def get_assignments(self, course_id):

        return self.repo.get_by_course(course_id)