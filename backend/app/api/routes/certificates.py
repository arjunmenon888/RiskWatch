from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_user
from app.db.session import get_db
from app.models.certificate import PlayerCertificate
from app.models.publishing import PublishedGameVersion, PublishedPlayerProgress
from app.models.user import User
from app.schemas.certificate import CertificateRead
from app.services.certificates.service import certificate_eligible, issue_certificate, render_certificate_pdf

router = APIRouter(prefix="/api/player", tags=["player-certificates"])


@router.get("/certificates", response_model=list[CertificateRead])
def list_certificates(
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> list[PlayerCertificate]:
    return list(
        db.scalars(
            select(PlayerCertificate)
            .where(PlayerCertificate.player_id == current_user.id)
            .order_by(PlayerCertificate.issued_at.desc(), PlayerCertificate.id.desc())
        )
    )


@router.post(
    "/games/{game_id}/certificates",
    response_model=CertificateRead,
    status_code=status.HTTP_201_CREATED,
)
def claim_certificate(
    game_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> PlayerCertificate:
    progress = db.scalar(
        select(PublishedPlayerProgress).where(
            PublishedPlayerProgress.player_id == current_user.id,
            PublishedPlayerProgress.game_id == game_id,
        )
    )
    if progress is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complete the published game before claiming its certificate.",
        )
    publication = db.get(PublishedGameVersion, progress.publication_id)
    if publication is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Published version not found.")
    if not certificate_eligible(progress, publication):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Complete every published level before claiming its certificate.",
        )
    certificate = issue_certificate(current_user, progress, publication, db)
    db.commit()
    db.refresh(certificate)
    return certificate


@router.get("/certificates/{certificate_id}/download")
def download_certificate(
    certificate_id: int,
    current_user: Annotated[User, Depends(require_user)],
    db: Annotated[Session, Depends(get_db)],
) -> StreamingResponse:
    certificate = db.get(PlayerCertificate, certificate_id)
    if certificate is None or certificate.player_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Certificate not found.")
    pdf = render_certificate_pdf(certificate)
    filename = f"riskwatch-{certificate.certificate_number}.pdf"
    return StreamingResponse(
        BytesIO(pdf),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
