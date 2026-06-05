const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Получение токена из localStorage
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

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
  
  const token = getToken();
  const sessionId = getSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  // 👇 Добавляем токен в заголовок, если он есть
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (sessionId) {
    // Для гостевых пользователей добавляем session ID
    headers['X-Session-ID'] = sessionId;
  }

  const defaultOptions: RequestInit = {
    headers,
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 204) {
      return {} as T;
    }
    
    if (!response.ok) {
      let errorMessage = '';
      
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
  getAll: () => fetchAPI<any[]>('/trainings/'),
  getById: (id: string) => fetchAPI<any>(`/trainings/${id}`),
  create: (data: any) => {
    return fetchAPI<any>('/trainings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: (id: string, data: any) => fetchAPI<any>(`/trainings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => fetchAPI<void>(`/trainings/${id}`, {
    method: 'DELETE',
  }),
};

// Упражнения
export const exerciseAPI = {
  getByTraining: (trainingId: string) => fetchAPI<any[]>(`/exercises/training/${trainingId}`),
  create: (data: any) => fetchAPI<any>('/exercises/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: any) => fetchAPI<any>(`/exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
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
  getMe: () => fetchAPI<any>('/auth/me'),
};

// Telegram API
export const telegramAPI = {
  getStatus: () => fetchAPI<any>('/users/me/telegram/status'),
  generateLink: () => fetchAPI<any>('/users/me/telegram/link', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  unlink: () => fetchAPI<any>('/users/me/telegram/unlink', {
    method: 'DELETE',
  }),
  sendTestNotification: () => fetchAPI<any>('/users/me/telegram/test', {
    method: 'POST',
    body: JSON.stringify({}),
  }),
  updateSettings: (enabled: boolean) => fetchAPI<any>('/users/me/telegram/settings', {
    method: 'PUT',
    body: JSON.stringify({
      telegram_notifications_enabled: enabled
    }),
  }),
};