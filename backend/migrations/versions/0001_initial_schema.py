"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-10-08 10:29:39.832304

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def _created_at(name: str = "created_at") -> sa.Column:
    return sa.Column(name, sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True)


def upgrade() -> None:
    op.create_table(
        "themes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("text", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_themes")),
        sa.UniqueConstraint("text", name=op.f("uq_themes_text")),
    )
    op.create_index(op.f("ix_themes_id"), "themes", ["id"])

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=100), nullable=False),
        sa.Column("hashed_password", sa.String(length=128), nullable=False),
        sa.Column("avatar", sa.String(length=255), nullable=True),
        sa.Column("role", sa.String(length=20), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        _created_at(),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_users")),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"])
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "rooms",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=6), nullable=False),
        sa.Column("max_players", sa.Integer(), nullable=False),
        sa.Column("round_time", sa.Integer(), nullable=False),
        sa.Column("max_rounds", sa.Integer(), nullable=False),
        sa.Column("target_score", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("creator_id", sa.Integer(), nullable=False),
        _created_at(),
        sa.Column("is_public", sa.Boolean(), server_default=sa.false(), nullable=False),
        sa.ForeignKeyConstraint(["creator_id"], ["users.id"], name=op.f("fk_rooms_creator_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rooms")),
        sa.UniqueConstraint("code", name=op.f("uq_rooms_code")),
    )
    op.create_index(op.f("ix_rooms_id"), "rooms", ["id"])

    op.create_table(
        "chat_messages",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        _created_at(),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], name=op.f("fk_chat_messages_room_id_rooms")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_chat_messages_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_chat_messages")),
    )
    op.create_index(op.f("ix_chat_messages_id"), "chat_messages", ["id"])

    op.create_table(
        "room_players",
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=True),
        _created_at("joined_at"),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], name=op.f("fk_room_players_room_id_rooms")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_room_players_user_id_users")),
        sa.PrimaryKeyConstraint("room_id", "user_id", name=op.f("pk_room_players")),
    )

    op.create_table(
        "rounds",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("room_id", sa.Integer(), nullable=False),
        sa.Column("round_number", sa.Integer(), nullable=False),
        sa.Column("theme", sa.String(length=100), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=True),
        sa.Column("start_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("end_time", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["room_id"], ["rooms.id"], name=op.f("fk_rounds_room_id_rooms")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_rounds")),
    )
    op.create_index(op.f("ix_rounds_id"), "rounds", ["id"])

    op.create_table(
        "drawings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("round_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(length=255), nullable=False),
        _created_at(),
        sa.Column("score", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["round_id"], ["rounds.id"], name=op.f("fk_drawings_round_id_rounds")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_drawings_user_id_users")),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_drawings")),
    )
    op.create_index(op.f("ix_drawings_id"), "drawings", ["id"])

    op.create_table(
        "drawing_votes",
        sa.Column("voter_id", sa.Integer(), nullable=False),
        sa.Column("drawing_id", sa.Integer(), nullable=False),
        _created_at("voted_at"),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["drawing_id"], ["drawings.id"], name=op.f("fk_drawing_votes_drawing_id_drawings")),
        sa.ForeignKeyConstraint(["voter_id"], ["users.id"], name=op.f("fk_drawing_votes_voter_id_users")),
        sa.PrimaryKeyConstraint("voter_id", "drawing_id", name=op.f("pk_drawing_votes")),
    )


def downgrade() -> None:
    # Children before parents, so foreign keys never point at a dropped table.
    for table in ("drawing_votes", "drawings", "rounds", "room_players", "chat_messages", "rooms", "users", "themes"):
        op.drop_table(table)
