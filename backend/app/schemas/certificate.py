from datetime import datetime

from pydantic import BaseModel


class CertificateRead(BaseModel):
    id: int
    certificate_number: str
    player_id: int
    game_id: int
    publication_id: int
    player_name: str
    game_title: str
    version_number: int
    completed_at: datetime
    issued_at: datetime

    model_config = {"from_attributes": True}
