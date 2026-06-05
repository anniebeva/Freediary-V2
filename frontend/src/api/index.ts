const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Получение session ID для гостевых пользователей
const getSessionId = (): string | null => {
  return localStorage.getItem('sessionId');
};

// Общая функция для выполнения запросов
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const sessionId = getSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (sessionId) {
    // Для гостевых пользователей добавляем session ID
    headers['X-Session-ID'] = sessionId;
  }

  const defaultOptions: RequestInit = {
    headers,
    credentials: 'include', // Включаем отправку cookie
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    // 👇 ДОБАВЬ ЭТУ ПРОВЕРКУ (ОБРАБОТКА ПУСТОГО ОТВЕТА 204)
    if (response.status === 204) {
      return {} as T;
    }
    
    if (!response.ok) {
      let errorMessage = '';
      
      // Обработка ошибок по статусу
      switch (response.status) {
        case 400:
          errorMessage = 'Неверные данные';
          break;
        case 401:
          errorMessage = 'Необходима авторизация';
          break;
        case 403:
          errorMessage = 'Нет прав для этого действия';
          break;
        case 404:
          errorMessage = 'Данные не найдены';
          break;
        case 500:
          errorMessage = 'Ошибка сервера, попробуйте позже';
          break;
        default:
          errorMessage = `HTTP error! status: ${response.status}`;
      }
      
      // Пытаемся получить детальную информацию об ошибке из ответа
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = `Ошибки валидации: ${errorData.detail.map((err: any) => err.msg || err.message).join(', ')}`;
          } else {
            errorMessage = errorData.detail;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch (parseError) {
        // Если не удалось распарсить JSON, используем стандартное сообщение
      }
      
      throw new Error(`${errorMessage} (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Тренировки
export const trainingAPI = {
  // Получить все тренировки
  getAll: () => fetchAPI<any[]>('/trainings/'),
  
  // Получить тренировку по ID
  getById: (id: string) => fetchAPI<any>(`/trainings/${id}`),
  
  // Создать новую тренировку
  create: (data: any) => {
    return fetchAPI<any>('/trainings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  
  // Обновить тренировку
  update: (id: string, data: any) => fetchAPI<any>(`/trainings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Удалить тренировку
  delete: (id: string) => fetchAPI<void>(`/trainings/${id}`, {
    method: 'DELETE',
  }),
};

// Упражнения
export const exerciseAPI = {
  // Получить упражнения для тренировки
  getByTraining: (trainingId: string) => fetchAPI<any[]>(`/exercises/training/${trainingId}`),
  
  // Создать упражнение
  create: (data: any) => fetchAPI<any>('/exercises/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Обновить упражнение
  update: (id: string, data: any) => fetchAPI<any>(`/exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Удалить упражнение
  delete: (id: string) => fetchAPI<void>(`/exercises/${id}`, {
    method: 'DELETE',
  }),
};

// Аутентификация
export const authAPI = {
  register: (data: any) => fetchAPI<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  login: (data: any) => fetchAPI<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  logout: () => fetchAPI<void>('/auth/logout', {
    method: 'POST',
  }),
  getMe: () => fetchAPI<any>('/auth/me'),  // 👈 добавить эту строку
};

// Telegram API
export const telegramAPI = {
  // Получить статус Telegram
  getStatus: () => fetchAPI<any>('/users/me/telegram/status'),
  
  // Сгенерировать ссылку для привязки
  generateLink: () => fetchAPI<any>('/users/me/telegram/link', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  
  // Отвязать Telegram
  unlink: () => fetchAPI<any>('/users/me/telegram/unlink', {
    method: 'DELETE',
  }),
  
  // Отправить тестовое уведомление
  sendTestNotification: () => fetchAPI<any>('/users/me/telegram/test', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  
  // Обновить настройки уведомлений
  updateSettings: (enabled: boolean) => fetchAPI<any>('/users/me/telegram/settings', {
    method: 'PUT',
    body: JSON.stringify({
      telegram_notifications_enabled: enabled
    }),
  }),
};
