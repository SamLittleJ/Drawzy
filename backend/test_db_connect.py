from sqlalchemy import text
from database import engine

with engine.connect() as connection:
    result = connection.execute(text("SELECT 'Hello, World!'"))
    print("Test query result: ", result.fetchone())