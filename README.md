# 🎨 Ghibli Diffusion Studio

> Transform your imagination into Studio Ghibli-style artwork using AI-powered image generation

A full-stack web application that combines the power of **Stable Diffusion** with **Studio Ghibli LoRA** and **LCM (Latent Consistency Models)** to generate beautiful anime-style artwork in seconds. Built with FastAPI, React, and PyTorch.

![Ghibli Studio Banner](https://img.shields.io/badge/AI-Powered-orange?style=for-the-badge) ![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge) ![Python](https://img.shields.io/badge/Python-3.10+-green?style=for-the-badge) ![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge)

---

## ✨ Features

### 🖼️ **AI Art Generation**
- **Text-to-Image**: Generate Studio Ghibli-style artwork from text descriptions
- **Image-to-Image (Remix)**: Transform existing images into Ghibli-style art
- **Turbo Mode**: Lightning-fast generation (4-8 steps) using LCM optimization
- **Smart Prompt Enhancement**: Automatically enriches prompts with style keywords

### 💬 **Chat-Based Interface**
- **Multi-Session Support**: Create and manage multiple chat sessions
- **Real-time Updates**: WebSocket-powered live generation status
- **Image Gallery**: Browse and download all your generated artwork
- **Conversation History**: All prompts and images saved per session

### 🔐 **User Authentication**
- **Secure Login/Registration**: JWT-based authentication
- **Password Recovery**: Token-based password reset system
- **Protected Routes**: Session-based access control

### ⚙️ **Advanced Controls**
- **Guidance Scale**: Adjust creativity vs. prompt adherence (1.0-3.0)
- **Remix Strength**: Control transformation intensity (0.1-1.0)
- **Background Task Queue**: Async generation with status tracking

### 🎨 **Modern UI/UX**
- **Glassmorphism Design**: Beautiful gradient backgrounds and blur effects
- **Dark Theme**: Eye-friendly interface with vibrant accent colors
- **Responsive Layout**: Works seamlessly on desktop and tablet
- **Real-time Feedback**: Visual indicators for pending/processing/completed tasks

---

## 🛠️ Tech Stack

### **Backend**
- **FastAPI** - High-performance Python web framework
- **PyTorch** - Deep learning framework for model inference
- **Diffusers (Hugging Face)** - Stable Diffusion pipeline management
- **PostgreSQL** - Production database with SQLAlchemy ORM
- **WebSockets** - Real-time client-server communication
- **JWT Authentication** - Secure token-based auth with `python-jose`
- **Passlib + Bcrypt** - Password hashing and verification

### **Frontend**
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling
- **WebSocket API** - Real-time updates from backend

### **AI/ML**
- **Stable Diffusion 1.5** (DreamShaper v8 base model)
- **LCM LoRA** - Latent Consistency Model for 4-8 step generation
- **Studio Ghibli LoRA** - Fine-tuned style adapter
- **CUDA Support** - GPU-accelerated inference (CPU fallback available)

---

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+** (recommended: 3.11)
- **Node.js 18+** and npm
- **PostgreSQL 14+** (running locally or remote)
- **NVIDIA GPU** (optional, but recommended for faster generation)
- **Git**

---

### 📦 Installation

#### 1️⃣ **Clone the Repository**
```bash
git clone https://github.com/yourusername/ghibli-project.git
cd ghibli-project
```

---

#### 2️⃣ **Backend Setup**

##### **Step 1: Create Python Virtual Environment**
```bash
python -m venv .venv
```

##### **Step 2: Activate Virtual Environment**
**Windows:**
```bash
.venv\Scripts\activate
```

**macOS/Linux:**
```bash
source .venv/bin/activate
```

##### **Step 3: Install Python Dependencies**
Create a `requirements.txt` in the project root:
```txt
fastapi
uvicorn[standard]
sqlalchemy
psycopg2-binary
python-jose[cryptography]
passlib[bcrypt]
python-multipart
python-dotenv
torch
diffusers
transformers
accelerate
safetensors
Pillow
requests
```

Then install:
```bash
pip install -r requirements.txt
```

##### **Step 4: Download Ghibli LoRA Model**
```bash
cd backend
python download_lora.py
```
*This downloads a 38MB safetensors file*

##### **Step 5: Configure Environment Variables**
Create `backend/.env` based on `.env.example`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/ghibli_db
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

> **Note:** Replace `username`, `password`, and database name with your PostgreSQL credentials.

##### **Step 6: Initialize Database**
The database tables will be created automatically when you first run the backend (thanks to SQLAlchemy).

---

#### 3️⃣ **Frontend Setup**

##### **Step 1: Navigate to Frontend Directory**
```bash
cd ../frontend
```

##### **Step 2: Install Dependencies**
```bash
npm install
```

---

### 🎯 Running the App

#### **Option A: Run Backend and Frontend Separately**

**Terminal 1 - Backend (FastAPI):**
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend (Next.js):**
```bash
cd frontend
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

---

#### **Option B: Production Build**

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run build
npm start
```

---

## 📖 Usage Guide

### 1. **Create an Account**
- Navigate to [http://localhost:3000/login](http://localhost:3000/login)
- Click "Create Account"
- Enter username and password
- Log in with your credentials

### 2. **Generate Your First Artwork**
- Click **"+ New Chat"** to start a session
- Type a prompt like: `"a magical forest with floating islands"`
- Press Enter or click Send
- Watch the AI create your artwork in real-time!

### 3. **Remix an Image**
- Click the **image upload icon** in the chat input
- Upload any image
- Add a prompt like: `"make it more colorful"`
- Adjust **Remix Strength** in Settings (gear icon)

### 4. **Browse Gallery**
- Click **"🖼 View Gallery"** in the sidebar
- Download your favorite creations

---

## 🧪 Example Prompts

```
🌄 a serene countryside with rolling hills and a small cottage
🏯 ancient Japanese temple surrounded by cherry blossoms
🌊 a girl standing on a cliff overlooking the ocean at sunset
🐉 a majestic dragon flying through stormy clouds
🌸 whimsical garden with giant flowers and tiny houses
```

---

## 🔧 Configuration

### **Generation Settings**
Located in the Settings panel (gear icon):
- **Guidance Scale (1.0-3.0)**: Lower = more creative, Higher = stricter prompt following
- **Remix Strength (0.1-1.0)**: Lower = subtle changes, Higher = dramatic transformation

### **Backend Environment Variables**
```env
DATABASE_URL=postgresql://...     # PostgreSQL connection string
SECRET_KEY=...                     # JWT signing key
```

---

## 📂 Project Structure

```
ghibli-project/
├── backend/
│   ├── main.py              # FastAPI app & routes
│   ├── generate.py          # Image generation logic
│   ├── auth.py              # JWT authentication
│   ├── models.py            # SQLAlchemy database models
│   ├── database.py          # Legacy JSON database (unused)
│   ├── download_lora.py     # LoRA download script
│   ├── .env                 # Environment variables (not committed)
│   ├── .env.example         # Template for .env
│   └── outputs/             # Generated images (gitignored)
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Main chat interface
│   │   ├── login/
│   │   │   └── page.tsx     # Authentication page
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── package.json
│   └── next.config.ts
│
├── ghibli.safetensors       # Studio Ghibli LoRA (gitignored)
├── .gitignore
└── README.md
```

---

## 🐛 Troubleshooting

### **Issue: "CUDA not available"**
**Solution:** The app will automatically fall back to CPU. For GPU support, install PyTorch with CUDA:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cu118
```

### **Issue: "Database connection failed"**
**Solution:** 
1. Ensure PostgreSQL is running: `pg_ctl status`
2. Verify credentials in `backend/.env`
3. Create the database: `createdb ghibli_db`

### **Issue: "Module not found" errors**
**Solution:** Make sure you're in the correct directory and virtual environment is activated:
```bash
# Backend
cd backend
pip install -r ../requirements.txt

# Frontend
cd frontend
npm install
```

### **Issue: Images not loading**
**Solution:** Check that the backend is running on `http://localhost:8000` and CORS is enabled.

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgments

- **[Stability AI](https://stability.ai/)** - Stable Diffusion models
- **[Hugging Face](https://huggingface.co/)** - Diffusers library and model hosting
- **[Lykon/DreamShaper](https://huggingface.co/Lykon/dreamshaper-8)** - Base model
- **[LCM LoRA](https://huggingface.co/latent-consistency/lcm-lora-sdv1-5)** - Fast inference
- **[Studio Ghibli LoRA](https://huggingface.co/artificialguybr/studioghibli-redmond-1-5v-studio-ghibli-lora-for-liberteredmond-sd-1-5)** - Style adapter

---

## 📧 Support

If you encounter any issues or have questions:
- 🐛 [Open an issue](https://github.com/yourusername/ghibli-project/issues)
- 💬 [Start a discussion](https://github.com/yourusername/ghibli-project/discussions)

---

## 🌟 Star History

If you find this project useful, please consider giving it a star! ⭐

---

<div align="center">
  <p>Made with ❤️ by the Ghibli Diffusion Studio Team</p>
  <p>
    <a href="https://github.com/yourusername/ghibli-project">GitHub</a> •
    <a href="https://github.com/yourusername/ghibli-project/issues">Issues</a> •
    <a href="https://github.com/yourusername/ghibli-project/blob/main/LICENSE">License</a>
  </p>
</div>
