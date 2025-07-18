"""Added changes to room

Revision ID: ce67c7d0529f
Revises: 6afda58722ec
Create Date: 2025-06-26 18:31:59.675350

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision: str = 'ce67c7d0529f'
down_revision: Union[str, None] = '6afda58722ec'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.alter_column('chat_messages', 'created_at',
               existing_type=mysql.DATETIME(),
               nullable=True,
               existing_server_default=sa.text('(now())'))
    op.create_index(op.f('ix_chat_messages_id'), 'chat_messages', ['id'], unique=False)
    op.add_column('drawing_votes', sa.Column('score', sa.Integer(), nullable=False))
    op.add_column('rooms', sa.Column('max_rounds', sa.Integer(), nullable=False))
    op.add_column('rooms', sa.Column('target_score', sa.Integer(), nullable=False))
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_column('rooms', 'target_score')
    op.drop_column('rooms', 'max_rounds')
    op.drop_column('drawing_votes', 'score')
    op.drop_index(op.f('ix_chat_messages_id'), table_name='chat_messages')
    op.alter_column('chat_messages', 'created_at',
               existing_type=mysql.DATETIME(),
               nullable=False,
               existing_server_default=sa.text('(now())'))
    # ### end Alembic commands ###
