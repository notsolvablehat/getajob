import uuid

from appwrite.client import Client
from appwrite.input_file import InputFile
from appwrite.services.storage import Storage

from app.config import settings

client = Client()
client.set_endpoint(settings.APPWRITE_API)
client.set_project(settings.APPWRITE_PROJECT_ID)
client.set_key(settings.APPWRITE_API_KEY)

storage = Storage(client)


async def upload_file(
    file_bytes: bytes, filename: str, folder_prefix: str = "resumes"
) -> str:
    """
    Uploads a file to Appwrite storage and returns the generated file ID.
    """
    unique_id = uuid.uuid4().hex[:20]
    file_id = f"{folder_prefix}-{unique_id}".replace("_", "-").lower()

    # The Appwrite python SDK is synchronous, so we run it in a thread if we need async,
    # but for simplicity, we'll just call it here.
    # Note: In a real high-throughput scenario, run this in an executor.
    result = storage.create_file(
        bucket_id=settings.APPWRITE_BUCKET_ID,
        file_id=file_id,
        file=InputFile.from_bytes(file_bytes, filename=filename),
    )
    return result.id


def get_file_url(file_id: str) -> str:
    """
    Returns the view URL for a file.
    """
    return f"{settings.APPWRITE_API}/storage/buckets/{settings.APPWRITE_BUCKET_ID}/files/{file_id}/view?project={settings.APPWRITE_PROJECT_ID}"
