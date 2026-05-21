from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.auth import router as auth_router
from app.routes.exercises import router as exercises_router
from app.routes.trainings import router as trainings_router

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",      # React фронтенд
        "http://127.0.0.1:3000",      # Альтернативный адрес фронта
        "http://localhost:8000",      # Сваггер на том же домене
        "http://127.0.0.1:8000",      # Сваггер
        "*"                            # Временно разрешить все (только для тестов)
    ],
    allow_credentials=True,
    allow_methods=["*"],               # Разрешить все HTTP методы
    allow_headers=["*"],               # Разрешить все заголовки
)

app.include_router(auth_router)
app.include_router(trainings_router)
app.include_router(exercises_router)


@app.get("/")
def read_root():
    return {"message": "Welcome to FreeDiary API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)