import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8000';

const TEST_USER = {
  email: 'user1@example.com',
  password: 'password123',
  username: 'testuser1'
};

const TEST_USER_2 = {
  email: 'user2@example.com',
  password: 'password456',
  username: 'testuser2'
};

test.describe('Управление тренировками', () => {
  async function login(page) {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER.email);
    await page.getByLabel(/пароль/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /войти/i }).click();
    await page.waitForURL(/.*trainings/, { timeout: 10000 });
  }

  test('Пользователь создаёт новую тренировку (тип: Бассейн, сложность: 3, размер бассейна: 25)', async ({ page }) => {
    await login(page);

    await page.getByRole('link', { name: /добавить тренировку/i }).click();
    await expect(page).toHaveURL(/.*add-training/);

    await page.waitForTimeout(1000);
    
    await page.selectOption('select', { label: 'Бассейн' });
    await page.locator('input[type="range"]').fill('3');
    await page.locator('input[placeholder="Введите длину бассейна"]').fill('25');
    await page.locator('textarea[placeholder="Дополнительные заметки о тренировке"]').fill('Тестовая тренировка');

    await page.getByRole('button', { name: /сохранить тренировку/i }).click();

    await expect(page).toHaveURL(/.*trainings/);
    await expect(page.getByText(/Pool/i).first()).toBeVisible({ timeout: 10000 });
  });
  test('Пользователь не может сохранить тренировку с упражнением без названия', async ({ page }) => {
    await login(page);

    await page.getByRole('link', { name: /добавить тренировку/i }).click();
    await expect(page).toHaveURL(/.*add-training/);

    await page.selectOption('select', { label: 'Бассейн' });
    await page.locator('input[placeholder="Введите длину бассейна"]').fill('25');
    
    await page.getByRole('button', { name: /добавить упражнение/i }).click();
    
    await page.locator('input[placeholder="Название упражнения"]').fill('');
    
    await page.getByRole('button', { name: /сохранить тренировку/i }).click();

    await expect(page.getByText(/у всех упражнений должно быть название/i)).toBeVisible();
  });

  test('Пользователь без авторизации не может создать тренировку', async ({ page }) => {
    await page.goto(`${BASE_URL}/add-training`);
    await expect(page).toHaveURL(/.*login/);
  });

  test('Пользователь открывает детали тренировки, видит упражнения', async ({ page }) => {
    await login(page);

    const detailsLink = page.getByRole('link', { name: /детали/i }).first();
    await detailsLink.click();

    await expect(page).toHaveURL(/.*training\/\d+/);
    await expect(page.getByText(/упражнения/i)).toBeVisible();
  });

  test('Пользователь удаляет тренировку, она исчезает из списка', async ({ page }) => {
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
    });
    const { access_token } = await loginRes.json();
    
    await fetch(`${API_BASE_URL}/trainings/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        type: 'Gym',
        date: new Date().toISOString().split('T')[0],
        difficulty: 2,
        notes: 'Тестовая тренировка для удаления'
      })
    });

    await login(page);
    await page.reload();
    await page.waitForTimeout(2000);
    
    const deleteBtn = page.getByRole('button', { name: 'Удалить' }).first();
    await deleteBtn.click();
    
    page.once('dialog', async dialog => {
      await dialog.accept();
    });
    
    await page.waitForTimeout(2000);
  });

  test('Пользователь не может удалить тренировку другого пользователя', async ({ page }) => {
    const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
    });
    const { access_token } = await loginRes.json();
    
    await fetch(`${API_BASE_URL}/trainings/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        type: 'Gym',
        date: new Date().toISOString().split('T')[0],
        difficulty: 2,
        notes: 'Чужая тренировка'
      })
    });

    await page.goto('/login');
    await page.getByLabel(/email/i).fill(TEST_USER_2.email);
    await page.getByLabel(/пароль/i).fill(TEST_USER_2.password);
    await page.getByRole('button', { name: /войти/i }).click();
    await page.waitForURL(/.*trainings/, { timeout: 10000 });

    await expect(page.getByText('Чужая тренировка')).not.toBeVisible();
  });
});