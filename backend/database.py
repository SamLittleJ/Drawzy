import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

#Load environment variables from a .env file
load_dotenv()

#Get the database URL from the .env file
DATABASE_URL = os.getenv("DATABASE_URL")

#Create the SQLAlchemy engine
engine = create_engine(DATABASE_URL)

#Create a configured "Session" class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

#Base class for our classes definitions
Base = declarative_base()
