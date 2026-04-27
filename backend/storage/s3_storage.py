import os
import boto3

class S3Storage:

    def __init__(self):

        self.bucket = os.getenv("S3_BUCKET")
        self.client = boto3.client("s3", region_name="us-east-1")


    def upload_file(self, file, key):
        self.client.upload_fileobj(
            file,
            self.bucket,
            key
        )

        return f"https://{self.bucket}.s3.amazonaws.com/{key}"