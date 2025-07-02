import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from pathlib import Path

# Încărcare variabile de mediu
# • Rol: Încarcă setările din fișierul .env în mediul de execuție.
env_path = Path(__file__).parent / '.env'
load_dotenv(env_path)

# Citire URL baza de date
# • Rol: Preia conexiunea la baza de date din variabila de mediu DATABASE_URL.
# • Validare: Aruncă eroare dacă nu este setată.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    # Verificare configurare
    # • Rol: Asigură prezența variabilei DATABASE_URL și previne rularea fără configurație.
    raise RuntimeError("DATABASE_URL not set in .env file")

# Creare engine SQLAlchemy
# • Rol: Initializează conexiunea la baza de date folosind URL-ul specificat.
engine = create_engine(DATABASE_URL)

# Configurare sesiune DB
# • Rol: Definește clasa de sesiune pentru interacțiuni cu baza de date.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Basel class ORM
# • Rol: Clasă de bază pentru declarațiile modelelor SQLAlchemy.
Base = declarative_base()

# Dependență DB
# • Rol: Furnizează o sesiune de bază de date per request și o închide după utilizare.
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()