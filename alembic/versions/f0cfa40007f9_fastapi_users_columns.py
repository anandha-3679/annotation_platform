"""fastapi_users_columns

Revision ID: f0cfa40007f9
Revises: 75fc4755267e
Create Date: 2026-10-03 10:40:35.297730

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'f0cfa40007f9'
down_revision: Union[str, Sequence[str], None] = '75fc4755267e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('hashed_password', sa.String(length=1024), nullable=False), schema='public')
    op.add_column('users', sa.Column('is_active', sa.Boolean(), server_default=sa.text('true'), nullable=False), schema='public')
    op.add_column('users', sa.Column('is_superuser', sa.Boolean(), server_default=sa.text('false'), nullable=False), schema='public')
    op.add_column('users', sa.Column('is_verified', sa.Boolean(), server_default=sa.text('false'), nullable=False), schema='public')
    op.create_index(op.f('ix_public_users_email'), 'users', ['email'], unique=True, schema='public')


def downgrade() -> None:
    op.drop_index(op.f('ix_public_users_email'), table_name='users', schema='public')
    op.drop_column('users', 'is_verified', schema='public')
    op.drop_column('users', 'is_superuser', schema='public')
    op.drop_column('users', 'is_active', schema='public')
    op.drop_column('users', 'hashed_password', schema='public')

