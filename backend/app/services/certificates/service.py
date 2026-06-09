from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.certificate import PlayerCertificate
from app.models.publishing import PublishedGameVersion, PublishedPlayerProgress
from app.models.user import User


def certificate_eligible(
    progress: PublishedPlayerProgress,
    publication: PublishedGameVersion,
) -> bool:
    snapshot = publication.snapshot if isinstance(publication.snapshot, dict) else {}
    game = snapshot.get("game", {}) if isinstance(snapshot.get("game"), dict) else {}
    settings = game.get("certificate_settings", {}) if isinstance(game.get("certificate_settings"), dict) else {}
    levels = snapshot.get("levels", [])
    if settings.get("enabled") is not True or not isinstance(levels, list) or not levels:
        return False
    required_level_ids = {
        int(level["id"])
        for level in levels
        if isinstance(level, dict) and level.get("id") is not None
    }
    return (
        progress.status == "completed"
        and bool(required_level_ids)
        and required_level_ids.issubset(set(progress.completed_level_ids))
    )


def issue_certificate(
    player: User,
    progress: PublishedPlayerProgress,
    publication: PublishedGameVersion,
    db: Session,
) -> PlayerCertificate:
    existing = db.scalar(
        select(PlayerCertificate).where(
            PlayerCertificate.player_id == player.id,
            PlayerCertificate.publication_id == publication.id,
        )
    )
    if existing is not None:
        return existing

    game_snapshot = publication.snapshot.get("game", {}) if isinstance(publication.snapshot, dict) else {}
    certificate = PlayerCertificate(
        certificate_number=f"RW-{uuid4().hex[:12].upper()}",
        player_id=player.id,
        game_id=publication.game_id,
        publication_id=publication.id,
        player_name=player.name,
        game_title=str(game_snapshot.get("title") or "RiskWatch Learning Program"),
        version_number=publication.version_number,
        completed_at=progress.updated_at,
    )
    db.add(certificate)
    db.flush()
    return certificate


def render_certificate_pdf(certificate: PlayerCertificate) -> bytes:
    completed = _format_date(certificate.completed_at)
    navy = "0.02 0.09 0.17"
    gold = "0.74 0.43 0.05"
    cream = "0.98 0.97 0.93"
    commands = [
        f"{cream} rg 0 0 842 595 re f",
        f"{navy} rg 0 0 842 40 re f 0 555 842 40 re f",
        f"{navy} rg 0 0 m 180 0 l 0 175 l h f",
        f"{navy} rg 842 0 m 662 0 l 842 175 l h f",
        f"{gold} RG 2 w 14 14 814 567 re S",
        f"{gold} RG 0.7 w 20 20 802 555 re S",
        f"{gold} RG 3 w 36 523 m 205 523 l S",
        f"{gold} RG 1 w 36 516 m 190 516 l S",
        # Shield mark
        f"{navy} rg 389 535 m 421 550 l 453 535 l 449 497 l 421 478 l 393 497 l h f",
        f"{gold} RG 2 w 397 531 m 421 542 l 445 531 l 442 502 l 421 487 l 400 502 l h S",
        *_text("R", 421, 507, 31, "F2", gold),
        *_text("RISKWATCH", 421, 459, 20, "F2", navy),
        *_text("LEARN. AWARE. PREPARE.", 421, 442, 8, "F2", gold),
        *_text("CERTIFICATE", 390, 365, 52, "F3", gold),
        f"{gold} RG 1.2 w 210 344 m 320 344 l S 520 344 m 630 344 l S",
        *_text("OF COMPLETION", 420, 337, 16, "F2", navy),
        *_text("THIS CERTIFICATE IS PROUDLY PRESENTED TO", 390, 304, 10, "F1", navy),
        *_text(certificate.player_name, 390, 257, 31, "F4", navy),
        f"{gold} RG 1 w 225 242 m 555 242 l S",
        *_text("for successfully completing the learning program", 390, 216, 11, "F1", navy),
        *_text(certificate.game_title, 390, 189, 18, "F2", gold),
        *_text(
            f"Completed {completed}  |  Published version {certificate.version_number}",
            390,
            168,
            9,
            "F1",
            navy,
        ),
        # Seal
        f"{gold} rg 350 62 80 80 re f",
        f"{navy} rg 357 69 66 66 re f",
        f"{gold} RG 2 w 363 75 54 54 re S",
        *_text("RISK", 390, 108, 10, "F2", gold),
        *_text("AWARE", 390, 94, 10, "F2", gold),
        *_text("READY", 390, 80, 10, "F2", gold),
        # Signatures and certificate identity
        f"{gold} RG 1 w 105 104 m 260 104 l S",
        *_text("RISKWATCH LEARNING TEAM", 182, 88, 9, "F2", navy),
        *_text("DIRECTOR OF LEARNING", 182, 73, 8, "F1", navy),
        f"{gold} RG 1 w 520 104 m 675 104 l S",
        *_text(certificate.certificate_number, 597, 88, 9, "F2", navy),
        *_text("CERTIFICATE ID / VERIFICATION CODE", 597, 73, 8, "F1", navy),
        # Right-side ID ribbon
        f"{navy} rg 710 555 m 806 555 l 806 377 l 758 349 l 710 377 l h f",
        f"{gold} RG 2 w 716 551 m 800 551 l 800 381 l 758 357 l 716 381 l h S",
        *_text("CERTIFICATE ID", 758, 430, 8, "F2", cream),
        *_text(certificate.certificate_number, 758, 411, 8, "F1", cream),
    ]
    content = "\n".join(commands).encode("latin-1", "replace")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R /F2 6 0 R /F3 7 0 R /F4 8 0 R >> >> /Contents 4 0 R >>",
        b"<< /Length " + str(len(content)).encode() + b" >>\nstream\n" + content + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Times-Italic >>",
    ]
    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode())
        output.extend(obj)
        output.extend(b"\nendobj\n")
    xref_offset = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n".encode())
    output.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF".encode()
    )
    return bytes(output)


def _format_date(value: datetime) -> str:
    return value.strftime("%B %d, %Y")


def _pdf_text(value: str) -> str:
    return value.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _text(
    value: str,
    center_x: float,
    y: float,
    size: float,
    font: str,
    color: str,
) -> list[str]:
    safe_value = _pdf_text(value)
    approximate_width = len(value) * size * 0.52
    x = max(24, center_x - approximate_width / 2)
    return [
        "BT",
        f"/{font} {size} Tf",
        f"{color} rg",
        f"1 0 0 1 {x:.1f} {y:.1f} Tm",
        f"({safe_value}) Tj",
        "ET",
    ]
