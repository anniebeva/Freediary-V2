#!/usr/bin/env python3
"""
Seed-файл для наполнения базы данных тестовыми данными.
Запуск: python seed.py
"""

import sys
import os
from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, create_tables
from app.models.models import User, Training, Exercise, SessionTracking, SessionTraining, SessionExercise, TrainingType, UserRole
from app.core.security import get_password_hash


def create_test_data() -> None:
    """Создание тестовых данных в базе данных"""
    db = SessionLocal()
    
    try:
        print("Создание таблиц...")
        create_tables()
        print("Таблицы созданы успешно!")
        print("Создание тестовых пользователей...")
        
        user1 = User(
            username="testuser1",
            email="user1@example.com",
            password=get_password_hash("password123"),
            role="user"
        )
        db.add(user1)
        
        user2 = User(
            username="testuser2",
            email="user2@example.com",
            password=get_password_hash("password456"),
            role="user"
        )
        db.add(user2)
        
        admin_user = User(
            username="admin",
            email="admin@example.com",
            password=get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
        
        db.commit()
        db.refresh(user1)
        db.refresh(user2)
        db.refresh(admin_user)
        
        print(f"Созданы пользователи: {user1.username} (ID: {user1.id}, роль: {user1.role}), {user2.username} (ID: {user2.id}, роль: {user2.role}), {admin_user.username} (ID: {admin_user.id}, роль: {admin_user.role})")

        print("Создание тренировок для пользователя 1...")

        training1 = Training(
            user_id=user1.id,
            type="Pool",
            date=date.today() - timedelta(days=2),
            difficulty=3,
            notes="Хорошая тренировка в бассейне",
            pool_training={"poolSize": 25, "laps": 20, "style": "вольный"}
        )
        db.add(training1)

        training2 = Training(
            user_id=user1.id,
            type="Depth",
            date=date.today() - timedelta(days=1),
            difficulty=4,
            notes="Погружение на глубину",
            depth_training={"wetsuit": 5, "temperature": 15, "location": "Москва", "depth": 10}
        )
        db.add(training2)
        
        db.commit()
        db.refresh(training1)
        db.refresh(training2)
        
        print(f"Созданы тренировки: ID {training1.id} ({training1.type}), ID {training2.id} ({training2.type})")

        print("Создание упражнений...")

        exercise1 = Exercise(
            training_id=training1.id,
            name="Разминка",
            notes="10 минут плавания в спокойном темпе"
        )
        db.add(exercise1)
        
        exercise2 = Exercise(
            training_id=training1.id,
            name="Основная часть",
            notes="20 кругов по 25 метров"
        )
        db.add(exercise2)

        exercise3 = Exercise(
            training_id=training2.id,
            name="Разминка на суше",
            notes="15 минут растяжки"
        )
        db.add(exercise3)
        
        exercise4 = Exercise(
            training_id=training2.id,
            name="Погружение",
            notes="Погружение на 10 метров"
        )
        db.add(exercise4)
        
        db.commit()
        
        print(f"Создано 4 упражнения для тренировок")
        
        print("Создание тестовой сессии для гостя...")
        
        session = SessionTracking(
            session_id="test_session_123",
            expires_at=datetime.utcnow() + timedelta(hours=24)
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        
        session_training1 = SessionTraining(
            session_id=session.session_id,
            type="Gym",
            date=date.today(),
            difficulty=2,
            notes="Тренировка в зале",
            gym_training={"avgHeartRate": 120, "calories": 300, "duration": 45}
        )
        db.add(session_training1)
        
        db.commit()
        db.refresh(session_training1)
        
        session_exercise1 = SessionExercise(
            session_id=session.session_id,
            training_id=session_training1.id,
            name="Жим штанги лежа",
            notes="3 подхода по 10 повторений"
        )
        db.add(session_exercise1)
        
        session_exercise2 = SessionExercise(
            session_id=session.session_id,
            training_id=session_training1.id,
            name="Приседания",
            notes="4 подхода по 12 повторений"
        )
        db.add(session_exercise2)
        
        db.commit()
        
        print(f"Создана сессия: {session.session_id}")
        print(f"Создана сессионная тренировка: ID {session_training1.id} ({session_training1.type})")
        print(f"Создано 2 сессионных упражнения")
        
        print("\n" + "="*50)
        print("Seed данные успешно созданы!")
        print("="*50)
        print("\nСозданы следующие данные:")
        print(f"1. Пользователи: {user1.username} (user), {user2.username} (user), {admin_user.username} (admin)")
        print(f"2. Тренировки: {training1.type}, {training2.type}")
        print(f"3. Упражнения: 4 шт.")
        print(f"4. Сессия для гостя: {session.session_id}")
        print(f"5. Сессионная тренировка: {session_training1.type}")
        print(f"6. Сессионные упражнения: 2 шт.")
        print("\nДля проверки можно запустить сервер и проверить данные через API.")
        
    except Exception as e:
        print(f"Ошибка при создании seed данных: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    print("Начинаем создание seed данных для базы данных...")
    create_test_data()