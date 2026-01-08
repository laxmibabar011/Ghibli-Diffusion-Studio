from models import engine, Base
from sqlalchemy import text

def reset_db():
    print("Resetting database schema...")
    with engine.connect() as conn:
        # Drop tables in dependency order
        conn.execute(text("DROP TABLE IF EXISTS messages CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS sessions CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        conn.execute(text("DROP TABLE IF EXISTS tasks CASCADE"))
        conn.commit()
    
    # Recreate all
    Base.metadata.create_all(bind=engine)
    print("Database schema updated successfully.")

if __name__ == "__main__":
    reset_db()
