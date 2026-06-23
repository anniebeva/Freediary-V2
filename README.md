# 🏋️‍♂️ FreeDiary 

![Python](https://img.shields.io/badge/Python-3.9+-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.95.1-green?logo=fastapi)
![React](https://img.shields.io/badge/React-19.2.6-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.5-blue?logo=typescript)
![SQLite](https://img.shields.io/badge/SQLite-3.42.0-lightgrey?logo=sqlite)

**FreeDiary** is a full-featured web application for logging workouts, analyzing progress, and managing exercises. The project supports guest sessions and JWT authentication, has a role-based model (user/admin), and was developed with heavy AI assistance.



## 📋 Project Description

Full‑stack web application using FastAPI (backend) + React (frontend) + SQLite (database). It allows users to keep a workout diary, add exercises, view statistics, and analyze progress.

***Key Features***
✅ Guest sessions (no registration required)
✅ JWT authentication for registered users
✅ Role model: user (own data only) and admin (full access)
✅ Three workout types: Pool, Depth, Gym
✅ Manage exercises inside workouts
✅ Workout statistics and analytics
✅ Modern UI with Tailwind CSS

## 🛠️ Technologies

## 🛠️ Technologies

### Backend
- **Python 3.9+** – primary language
- **FastAPI 0.95.1** – modern web framework
- **SQLAlchemy 1.4.46** – ORM for database work
- **SQLite** – lightweight database
- **Argon2-cffi** – secure password hashing
- **Python-JOSE** – JWT tokens

### Frontend
- **React 19.2.6** – UI library
- **TypeScript 4.9.5** – type safety
- **React Router DOM 7.15.1** – routing
- **Tailwind CSS 3.4.0** – styling
- **Create React App** – build tool

## 🚀 Functionality

### 👥 User Roles
- **User** – can create, edit, and view only their own workouts
- **Admin** – full access to all users’ data

### 📊 Workout Types
1. **Pool** – swimming pool workouts
2. **Depth** – depth/underwater workouts
3. **Gym** – gym workouts
4. **Other** – other types

### 🏋️‍♂️ Exercise Management
- Add exercises to workouts
- Notes and comments for each exercise
- Group exercises by workout type

### 📈 Statistics
- Progress analysis over time
- Compare different workout types
- Efficiency graphs and charts

## 📦 Installation & Running

### Backend (FastAPI)

1. **Install dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
```

2. **Set up environment variables**
```bash
cp .env.example .env
# Edit parameters in .env file
```

3. **Run server**
```bash
uvicorn main:app --reload
```

**Environment variables (.env):**
```
DATABASE_URL=sqlite:///./freediary.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
DEBUG=True
CORS_ORIGINS=http://localhost:3000
```

### Frontend (React)

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Start development server**
```bash
npm start
```

3. **Build for production**
```bash
npm run build
```



## 🗄️ Database Architecture

Main Tables:
- **users** – id, username, email, password, role
- **trainings** – id, user_id, type, date, difficulty, notes
- **exercises** – id, training_id, name, notes
- **sessions** – session_id, created_at, expires_at
- **session_trainings** – guest session workouts
- **session_exercises** – guest session exercises

**Relationships:**
- User → Training (one‑to‑many)
- Training → Exercise (one‑to‑many)
- Session → SessionTraining (one‑to‑many)
- SessionTraining → SessionExercise (one‑to‑many)


---

🚀 **FreeDiary** – your personal companion in the world of workouts and athletic progress!
