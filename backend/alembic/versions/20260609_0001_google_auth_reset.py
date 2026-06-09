"""Reset prototype data and replace authentication schema.

Revision ID: 20260609_0001
Revises:
Create Date: 2026-06-09
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260609_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    if "users" not in inspector.get_table_names():
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("email", sa.String(255), nullable=False),
            sa.Column("name", sa.String(255), nullable=False),
            sa.Column("profile_image", sa.String(1000), nullable=True),
            sa.Column("provider", sa.String(32), server_default="google", nullable=False),
            sa.Column("google_sub", sa.String(255), nullable=True),
            sa.Column("password_hash", sa.String(512), nullable=True),
            sa.Column("email_verified", sa.Boolean(), server_default=sa.true(), nullable=False),
            sa.Column("role", sa.String(32), server_default="creator_player", nullable=False),
            sa.Column("reset_password_token_hash", sa.String(64), nullable=True),
            sa.Column("reset_password_expires_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_users_id", "users", ["id"], unique=False)
        op.create_index("ix_users_email", "users", ["email"], unique=True)
        op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)
        return

    # This project is intentionally resetting all prototype users and their
    # cascading game, document, gameplay, reward, and certificate data.
    op.execute("TRUNCATE TABLE users RESTART IDENTITY CASCADE")

    op.alter_column("users", "full_name", new_column_name="name")
    op.alter_column("users", "password_hash", existing_type=sa.String(512), nullable=True)
    op.add_column("users", sa.Column("profile_image", sa.String(1000), nullable=True))
    op.add_column(
        "users",
        sa.Column("provider", sa.String(32), server_default="google", nullable=False),
    )
    op.add_column("users", sa.Column("google_sub", sa.String(255), nullable=True))
    op.add_column(
        "users",
        sa.Column("email_verified", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("role", sa.String(32), server_default="creator_player", nullable=False),
    )
    op.add_column("users", sa.Column("reset_password_token_hash", sa.String(64), nullable=True))
    op.add_column(
        "users",
        sa.Column("reset_password_expires_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_users_google_sub", "users", ["google_sub"], unique=True)
    op.drop_column("users", "role_admin")
    op.drop_column("users", "role_creator")
    op.drop_column("users", "role_player")


def downgrade() -> None:
    op.execute("TRUNCATE TABLE users RESTART IDENTITY CASCADE")
    op.add_column(
        "users",
        sa.Column("role_player", sa.Boolean(), server_default=sa.true(), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("role_creator", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.add_column(
        "users",
        sa.Column("role_admin", sa.Boolean(), server_default=sa.false(), nullable=False),
    )
    op.drop_index("ix_users_google_sub", table_name="users")
    op.drop_column("users", "reset_password_expires_at")
    op.drop_column("users", "reset_password_token_hash")
    op.drop_column("users", "role")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "google_sub")
    op.drop_column("users", "provider")
    op.drop_column("users", "profile_image")
    op.alter_column("users", "password_hash", existing_type=sa.String(512), nullable=False)
    op.alter_column("users", "name", new_column_name="full_name")
