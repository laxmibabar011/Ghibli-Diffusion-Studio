import json
import os
import uuid
from datetime import datetime

DB_FILE = "chat_history.json"

def load_db():
    if not os.path.exists(DB_FILE):
        # Create a fresh DB if none exists
        return {"sessions": [], "messages": {}}
    try:
        with open(DB_FILE, "r") as f:
            return json.load(f)
    except:
        return {"sessions": [], "messages": {}}

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=4)

# --- FUNCTIONS CALLED BY MAIN.PY ---

def create_session(title="New Chat"):
    db = load_db()
    session_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    new_session = {
        "id": session_id,
        "title": title,
        "created_at": timestamp
    }
    
    # Add to the TOP of the list (newest first)
    db["sessions"].insert(0, new_session)
    db["messages"][session_id] = [] # Empty message list
    
    save_db(db)
    return new_session

def add_message(session_id, role, content, image_url=None):
    db = load_db()
    
    # If session doesn't exist, create it safely
    if session_id not in db["messages"]:
        db["messages"][session_id] = []
        
    msg = {
        "id": str(uuid.uuid4()),
        "role": role, # 'user' or 'assistant'
        "content": content,
        "image": image_url,
        "timestamp": datetime.now().strftime("%H:%M")
    }
    
    db["messages"][session_id].append(msg)
    save_db(db)
    return msg

def get_sessions():
    db = load_db()
    return db["sessions"]

def get_messages(session_id):
    db = load_db()
    return db["messages"].get(session_id, [])