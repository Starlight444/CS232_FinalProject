import boto3
from datetime import datetime, timedelta

from config import settings

sns = boto3.client("sns")

TOPIC_ARN = settings.SNS_TOPIC_ARN

class NotificationService:

    def __init__(self, assignment_service):
        self.assignment_service = assignment_service

    def check_deadlines(
        self,
        user_id,
        course_repo,
        external_repo
    ):

        assignments = self.assignment_service.get_all_assignments(
            user_id=user_id,
            course_repo=course_repo,
            external_repo=external_repo
        )

        tomorrow = datetime.utcnow() + timedelta(days=1)

        for assignment in assignments:

            due_date = assignment.get("due_date")

            if due_date and due_date <= tomorrow:

                sns.publish(
                    TopicArn=TOPIC_ARN,
                    Subject="Assignment Deadline Warning",
                    Message=f"The assignment '{assignment['title']}' will expire in less than 1 day."
                )