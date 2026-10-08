from sqlalchemy.orm import Session

from backend import models

# Simple, drawable nouns: short enough to guess in the chat.
DEFAULT_THEMES = [
    # Food
    "apple", "banana", "pizza", "cake", "ice cream", "sandwich", "carrot", "cheese", "cookie", "watermelon",
    # Animals
    "cat", "dog", "fish", "bird", "snake", "elephant", "giraffe", "penguin", "octopus", "butterfly",
    "spider", "turtle", "rabbit", "shark", "snail",
    # Places and buildings
    "house", "castle", "bridge", "lighthouse", "tent", "igloo", "island", "volcano", "mountain", "beach",
    # Transport
    "car", "bicycle", "train", "airplane", "rocket", "boat", "helicopter", "tractor", "submarine",
    # Nature and weather
    "sun", "moon", "star", "cloud", "rainbow", "tree", "flower", "cactus", "snowman", "lightning",
    # Everyday objects
    "guitar", "drum", "piano", "camera", "clock", "umbrella", "glasses", "key", "lamp", "chair",
    "book", "balloon", "kite", "crown", "sword", "candle", "ladder", "scissors", "toothbrush",
    # Characters
    "robot", "ghost", "dragon", "pirate ship", "alien", "mermaid", "wizard",
]  # fmt: skip


def seed_themes(db: Session) -> int:
    """Insert the default words if the table is empty. Returns how many were added."""
    if db.query(models.Theme).first() is not None:
        return 0
    db.add_all(models.Theme(text=text) for text in DEFAULT_THEMES)
    db.commit()
    return len(DEFAULT_THEMES)
