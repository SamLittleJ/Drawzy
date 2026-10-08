from sqlalchemy.orm import Session

from backend import models

DEFAULT_THEMES = [
    "A cat wearing a hat",
    "Haunted house",
    "Dragon eating pizza",
    "Robot on vacation",
    "Underwater city",
    "A snowman in the desert",
    "Pirate ship",
    "Alien invasion",
    "Your favourite food",
    "A dog riding a skateboard",
    "Castle in the clouds",
    "Rainy day in the city",
    "Superhero cat",
    "Volcano island",
    "A tiny elephant",
    "Space station",
    "Jungle adventure",
    "Monster under the bed",
    "Treehouse",
    "Dinosaur at the beach",
]


def seed_themes(db: Session) -> int:
    """Insert the default drawing prompts if the table is empty. Returns how many were added."""
    if db.query(models.Theme).first() is not None:
        return 0
    db.add_all(models.Theme(text=text) for text in DEFAULT_THEMES)
    db.commit()
    return len(DEFAULT_THEMES)
