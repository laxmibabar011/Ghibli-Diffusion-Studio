from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks, WebSocket, WebSocketDisconnect
from typing import List
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from pydantic import BaseModel
from PIL import Image
import io
import os
import uuid
from datetime import datetime

# --- IMPORT MODULES ---
# Make sure models.py and auth.py exist in your folder!
import models
import auth
from generate import generate_image, generate_img2img

app = FastAPI()

# 1. SETUP
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
os.makedirs("outputs", exist_ok=True)
app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")

# 2. DATA MODELS
class UserCreate(BaseModel):
    username: str
    password: str

class ChatCreate(BaseModel):
    title: str

class DrawRequest(BaseModel):
    chat_id: str
    prompt: str
    guidance: float = 1.5 # Lower guidance for LCM

class ForgotPasswordRequest(BaseModel):
    username: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --- WEBSOCKET MANAGER ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.user_connections: dict = {} # Map user_id -> WebSocket

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.user_connections[user_id] = websocket

    def disconnect(self, websocket: WebSocket, user_id: str):
        self.active_connections.remove(websocket)
        if user_id in self.user_connections:
            del self.user_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.user_connections:
            await self.user_connections[user_id].send_json(message)

manager = ConnectionManager()

# --- BACKGROUND TASKS ---

async def process_generation_task(task_id: str, prompt: str, chat_id: str, user_id: int, guidance: float):
    # Create a new DB session for the background thread
    db = models.SessionLocal()
    try:
        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        task.status = "PROCESSING"
        db.commit()
        
        # Notify User
        await manager.send_personal_message({"taskId": task_id, "status": "PROCESSING"}, str(user_id))
        
        # Generate
        file_path = generate_image(prompt, guidance=guidance)
        image_url = f"http://localhost:8000/{file_path}"
        
        # Update Task
        task.result = image_url
        task.status = "COMPLETED"
        
        # Save Message
        ai_msg = models.Message(role="assistant", content="Here is your art:", image_url=image_url, session_id=chat_id)
        db.add(ai_msg)
        db.commit()
        
        # Notify User
        await manager.send_personal_message({
            "taskId": task_id, 
            "status": "COMPLETED", 
            "result": image_url,
            "content": "Here is your art:"
        }, str(user_id))
        
    except Exception as e:
        print(f"Task Failed: {e}")
        task.status = "FAILED"
        db.commit()
        await manager.send_personal_message({"taskId": task_id, "status": "FAILED"}, str(user_id))
    finally:
        db.close()

async def process_remix_task(task_id: str, prompt: str, chat_id: str, user_id: int, input_path: str, strength: float, guidance: float):
    db = models.SessionLocal()
    try:
        task = db.query(models.Task).filter(models.Task.id == task_id).first()
        task.status = "PROCESSING"
        db.commit()
        
        # Notify User
        await manager.send_personal_message({"taskId": task_id, "status": "PROCESSING"}, str(user_id))
        
        # Load Input Image
        init_image = Image.open(input_path).convert("RGB")
        init_image = init_image.resize((512, 512))
        
        # Generate
        file_path = generate_img2img(prompt, init_image, strength=strength, guidance=guidance)
        output_url = f"http://localhost:8000/{file_path}"
        
        # Update Task
        task.result = output_url
        task.status = "COMPLETED"
        
        # Save Message
        db.add(models.Message(role="assistant", content="Remix complete:", image_url=output_url, session_id=chat_id))
        db.commit()
        
        # Notify User
        await manager.send_personal_message({
            "taskId": task_id, 
            "status": "COMPLETED", 
            "result": output_url,
            "content": "Remix complete:"
        }, str(user_id))
        
    except Exception as e:
        print(f"Task Failed: {e}")
        task.status = "FAILED"
        db.commit()
        await manager.send_personal_message({"taskId": task_id, "status": "FAILED"}, str(user_id))
    finally:
        db.close()

# --- AUTH ROUTES ---

@app.post("/register")
def register(user: UserCreate, db: Session = Depends(models.get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    # Create new user
    hashed_pw = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_pw)
    db.add(new_user)
    db.commit()
    return {"msg": "User created successfully"}

@app.post("/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(models.get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    
    access_token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {"id": current_user.id, "username": current_user.username}

@app.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(models.get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user:
        return {"msg": "If user exists, reset instructions sent."}
    
    token = auth.create_reset_token(user.username)
    print(f"\n[SIMULATION] Password Reset Link for {user.username}:")
    print(f"Token: {token}")
    print("In real app, this would be emailed.\n")
    
    return {"msg": "If user exists, reset instructions sent."}

@app.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(models.get_db)):
    username = auth.verify_reset_token(req.token)
    if not username:
        raise HTTPException(status_code=400, detail="Invalid or expired token")
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=400, detail="User not found")
        
    user.hashed_password = auth.get_password_hash(req.new_password)
    db.commit()
    return {"msg": "Password updated successfully"}

# --- CHAT ROUTES (Protected) ---

@app.get("/chats")
def get_chats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(models.get_db)):
    return db.query(models.ChatSession).filter(models.ChatSession.user_id == current_user.id).order_by(models.ChatSession.created_at.desc()).all()

@app.post("/chats")
def create_chat(req: ChatCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(models.get_db)):
    new_chat = models.ChatSession(id=str(uuid.uuid4()), title=req.title, user_id=current_user.id)
    db.add(new_chat)
    db.commit()
    db.refresh(new_chat)
    return new_chat

@app.get("/chats/{chat_id}")
def get_messages(chat_id: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(models.get_db)):
    chat = db.query(models.ChatSession).filter(models.ChatSession.id == chat_id, models.ChatSession.user_id == current_user.id).first()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    return chat.messages

# --- WEBSOCKET ROUTE ---
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    try:
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)

# --- ASYNC GENERATION ROUTES ---

@app.post("/draw")
def draw_art(
    req: DrawRequest, 
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(models.get_db)
):
    # Save User Prompt
    user_msg = models.Message(role="user", content=req.prompt, session_id=req.chat_id)
    db.add(user_msg)
    
    # Create Task
    task_id = str(uuid.uuid4())
    new_task = models.Task(id=task_id, status="PENDING")
    db.add(new_task)
    db.commit()
    
    # Queue Background Job
    background_tasks.add_task(
        process_generation_task, 
        task_id, req.prompt, req.chat_id, current_user.id, req.guidance
    )
    
    return {"task_id": task_id, "status": "PENDING"}

@app.post("/remix")
async def remix_image(
    background_tasks: BackgroundTasks,
    chat_id: str = Form(...), prompt: str = Form(...), file: UploadFile = File(...),
    strength: float = Form(0.55), guidance: float = Form(1.5),
    current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(models.get_db)
):
    # Save Input File
    contents = await file.read()
    input_filename = f"outputs/input_{uuid.uuid4()}.png"
    with open(input_filename, "wb") as f:
        f.write(contents)
    input_url = f"http://localhost:8000/{input_filename}"
    
    # Save User Msg
    db.add(models.Message(role="user", content=prompt, image_url=input_url, session_id=chat_id))
    
    # Create Task
    task_id = str(uuid.uuid4())
    new_task = models.Task(id=task_id, status="PENDING")
    db.add(new_task)
    db.commit()
    
    # Queue Background Job
    background_tasks.add_task(
        process_remix_task,
        task_id, prompt, chat_id, current_user.id, input_filename, strength, guidance
    )
    
    return {"task_id": task_id, "status": "PENDING", "input_url": input_url}

@app.get("/tasks/{task_id}")
def get_task_status(task_id: str, db: Session = Depends(models.get_db)):
    task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"id": task.id, "status": task.status, "result": task.result}

@app.get("/gallery")
def get_gallery():
    files = sorted(
        [f for f in os.listdir("outputs") if f.endswith(".png") and "input" not in f],
        key=lambda x: os.path.getmtime(os.path.join("outputs", x)),
        reverse=True
    )
    image_urls = [f"http://localhost:8000/outputs/{f}" for f in files]
    return {"images": image_urls}