import os
import boto3
import mimetypes

class S3Storage:

    def __init__(self):
        self.bucket = os.getenv("S3_BUCKET")
        self.client = boto3.client("s3", region_name="us-east-1")

    def upload_file(self, file, key):

        content_type, _ = mimetypes.guess_type(key)

        self.client.upload_fileobj(
            file,
            self.bucket,
            key,
            ExtraArgs={
                "ContentType": content_type or "application/octet-stream",
                "ContentDisposition": "inline"
            }
        )

        return f"https://{self.bucket}.s3.amazonaws.com/{key}"