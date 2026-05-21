# test_password.py
from app.core.security import get_password_hash, verify_password
from app.schemas.user import UserCreate
from app.crud.user import create_user

# Тест 1: Проверка хэширования напрямую
print("Test 1: Direct hashing")
password = "test123"
print(f"Password: '{password}', length: {len(password)} chars, bytes: {len(password.encode('utf-8'))}")

try:
    hashed = get_password_hash(password)
    print(f"✓ Hash successful: {hashed[:50]}...")
except Exception as e:
    print(f"✗ Hash failed: {e}")

# Тест 2: Проверка через UserCreate
print("\nTest 2: UserCreate validation")
try:
    user_data = UserCreate(
        username="testuser2",
        email="test2@example.com",
        password="test123"
    )
    print(f"✓ UserCreate successful, password: {user_data.password}")
except Exception as e:
    print(f"✗ UserCreate failed: {e}")

# Тест 3: Полный цикл создания пользователя
print("\nTest 3: Full user creation")
try:
    user = create_user(user_data)
    print(f"✓ User created with id: {user.id}")
except Exception as e:
    print(f"✗ User creation failed: {e}")
    import traceback
    traceback.print_exc()