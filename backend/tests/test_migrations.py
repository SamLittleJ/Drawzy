from alembic import command
from alembic.autogenerate import compare_metadata
from alembic.config import Config
from alembic.migration import MigrationContext
from sqlalchemy import inspect

from backend import database
from backend.database import Base


def _alembic_config(connection) -> Config:
    config = Config(str(database.BACKEND_DIR / "alembic.ini"))
    config.attributes["configure_logger"] = False
    config.attributes["connection"] = connection
    return config


def test_migrations_match_the_models(session_factory):
    """Fails when a model changes without a matching migration."""
    with database.engine.connect() as connection:
        diff = compare_metadata(MigrationContext.configure(connection), Base.metadata)

    assert diff == []


def test_migrations_can_be_rolled_back_and_reapplied(session_factory):
    app_tables = set(Base.metadata.tables)

    with database.engine.begin() as connection:
        config = _alembic_config(connection)

        command.downgrade(config, "base")
        assert set(inspect(connection).get_table_names()) == {"alembic_version"}

        command.upgrade(config, "head")
        assert set(inspect(connection).get_table_names()) == app_tables | {"alembic_version"}
