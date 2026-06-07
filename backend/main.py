from fastapi import FastAPI, Depends, BackgroundTasks, Request
from fastapi.responses import Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.orm import Session
import asyncio
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.database import get_db, create_tables
from app.routes.auth import router as auth_router
from app.routes.exercises import router as exercises_router
from app.routes.trainings import router as trainings_router
from app.routes.telegram import router as telegram_router
from app.crud.session_cleanup import cleanup_expired_sessions
from app.bot.handler import TelegramBotHandler
from app.core.logging import setup_logging
from app.core.middleware import RequestLoggingMiddleware

import sys
import io
import os
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Setup logging
setup_logging()

app = FastAPI()

# 1. Request logging middleware (первым!)
app.add_middleware(RequestLoggingMiddleware)

# 2. CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://freediary-ai-version.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Session-ID"],
    expose_headers=["*"],
)

# 3. Rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]
app.add_middleware(SlowAPIMiddleware)

# Регистрируем глобальный обработчик для ошибок валидации
def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=400,
        content={"detail": "Missing or invalid fields", "errors": exc.errors()}
    )

app.add_exception_handler(RequestValidationError, validation_exception_handler)

# Создаём экземпляр бота
bot_handler = TelegramBotHandler()

# Создание таблиц и запуск бота при запуске приложения
@app.on_event("startup")
async def on_startup():
    from app.core.logging import get_logger
    logger = get_logger()
    
    logger.info("Creating database tables...")
    create_tables()
    logger.info("Database tables created successfully!")
    
    logger.info("Starting Telegram bot...")
    try:
        await asyncio.wait_for(bot_handler.start_bot(), timeout=5)
        logger.info("Telegram bot started!")
    except asyncio.TimeoutError:
        logger.warning("Telegram bot startup timeout - continuing without bot")
    except Exception as e:
        logger.error(f"Telegram bot not available: {e}")
    
    asyncio.create_task(cleanup_sessions_task())

@app.on_event("shutdown")
async def on_shutdown():
    await bot_handler.stop_bot()

app.include_router(auth_router)
app.include_router(trainings_router)
app.include_router(exercises_router)
app.include_router(telegram_router)

# 4. Preflight handler для CORS
@app.options("/{rest_of_path:path}")
async def preflight_handler(request: Request):
    response = Response()
    response.headers["Access-Control-Allow-Origin"] = "https://freediary-ai-version.vercel.app"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Session-ID"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    return response

# 5. Обычные эндпоинты
@app.get("/")
def read_root():
    return {"message": "Welcome to FreeDiary API"}

@app.get("/health")
@app.head("/health")
def health_check():
    db_url = os.getenv("DATABASE_URL", "sqlite:///./freediary.db")
    db_type = "PostgreSQL" if "postgresql" in db_url else "SQLite"
    return {"status": "healthy", "database": db_type}

@app.post("/cleanup-sessions")
def cleanup_sessions(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    def cleanup_task():
        from app.core.logging import get_logger
        logger = get_logger()
        
        deleted_count = cleanup_expired_sessions(db)
        logger.info(f"Очищено {deleted_count} просроченных сессий")
    
    background_tasks.add_task(cleanup_task)
    return {"message": "Задача очистки сессий запущена в фоновом режиме"}

import os

@app.get("/db-info")
def get_database_info(db: Session = Depends(get_db)):
    from app.models.models import User, Training, Exercise, SessionTracking, SessionTraining, SessionExercise
    
    db_url = os.getenv("DATABASE_URL", "sqlite:///./freediary.db")
    db_type = "PostgreSQL" if "postgresql" in db_url else "SQLite"
    
    user_count = db.query(User).count()
    training_count = db.query(Training).count()
    exercise_count = db.query(Exercise).count()
    session_count = db.query(SessionTracking).count()
    session_training_count = db.query(SessionTraining).count()
    session_exercise_count = db.query(SessionExercise).count()
    
    return {
        "database": db_type,
        "tables": {
            "users": user_count,
            "trainings": training_count,
            "exercises": exercise_count,
            "sessions": session_count,
            "session_trainings": session_training_count,
            "session_exercises": session_exercise_count
        }
    }

# Настройка Swagger для Bearer авторизации
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Freediary API",
        version="1.0.0",
        routes=app.routes,
    )
    
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    for path in openapi_schema["paths"].values():
        for method in path.values():
            method.setdefault("security", []).append({"BearerAuth": []})
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

async def cleanup_sessions_task():
    from app.database import get_db
    from app.crud.session_cleanup import cleanup_expired_sessions
    from app.core.logging import get_logger
    
    logger = get_logger()
    
    while True:
        try:
            await asyncio.sleep(6 * 60 * 60)
            db = next(get_db())
            deleted_count = cleanup_expired_sessions(db)
            logger.info(f"Автоматически очищено {deleted_count} просроченных сессий")
        except Exception as e:
            logger.error(f"Ошибка при автоматической очистке сессий: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
