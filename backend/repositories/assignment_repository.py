from models.assignment_model import Assignment


class AssignmentRepository:

    def __init__(self, db):
        self.db = db

    def create(self, assignment):

        self.db.add(assignment)
        self.db.commit()
        self.db.refresh(assignment)

        return assignment

    def get_by_course(self, course_id):
        
        return (
            self.db.query(Assignment)
            .filter(Assignment.course_id == course_id)
            .all()
        )