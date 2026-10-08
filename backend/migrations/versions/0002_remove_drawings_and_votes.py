"""remove drawings and votes

The game became draw-and-guess: players score by guessing, so stored drawings and votes are no longer used.

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-08 10:49:15.276020

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Votes reference drawings, so they go first.
    op.drop_table("drawing_votes")
    op.drop_table("drawings")


def downgrade() -> None:
    op.create_table(
        "drawings",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("round_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("url", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
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
        sa.Column("voted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=True),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["drawing_id"], ["drawings.id"], name=op.f("fk_drawing_votes_drawing_id_drawings")),
        sa.ForeignKeyConstraint(["voter_id"], ["users.id"], name=op.f("fk_drawing_votes_voter_id_users")),
        sa.PrimaryKeyConstraint("voter_id", "drawing_id", name=op.f("pk_drawing_votes")),
    )
