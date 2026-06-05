from pathlib import Path
from uuid import uuid4

from fastapi import UploadFile

from app.core.config import settings


async def store_upload(game_id: int, upload: UploadFile, extension: str) -> Path:
    root = Path(settings.local_storage_dir)
    target_dir = root / "games" / str(game_id) / "documents"
    target_dir.mkdir(parents=True, exist_ok=True)
    safe_name = f"{uuid4().hex}{extension}"
    target_path = target_dir / safe_name

    with target_path.open("wb") as file:
        while chunk := await upload.read(1024 * 1024):
            file.write(chunk)

    return target_path
