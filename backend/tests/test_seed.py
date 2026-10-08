from backend import models
from backend.seed import DEFAULT_THEMES, seed_themes


def test_default_themes_are_seeded_once(db):
    assert seed_themes(db) == len(DEFAULT_THEMES)
    assert seed_themes(db) == 0
    assert db.query(models.Theme).count() == len(DEFAULT_THEMES)


def test_existing_themes_are_left_alone(db):
    db.add(models.Theme(text="Custom theme"))
    db.commit()

    assert seed_themes(db) == 0
    assert [t.text for t in db.query(models.Theme)] == ["Custom theme"]


def test_app_startup_seeds_themes(client, db):
    assert db.query(models.Theme).count() == len(DEFAULT_THEMES)
