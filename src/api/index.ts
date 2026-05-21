// API сервис для работы с бэкендом
const API_BASE_URL = 'http://localhost:8000';

// Получение токена из localStorage
const getAuthToken = (): string | null => {
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
  
  const token = getAuthToken();
  const sessionId = getSessionId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

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
    
    if (!response.ok) {
      // Пытаемся получить детальную информацию об ошибке
      let errorMessage = `HTTP error! status: ${response.status}`;
      
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = `Validation errors: ${errorData.detail.map((err: any) => err.msg || err.message).join(', ')}`;
          } else {
            errorMessage = errorData.detail;
          }
        }
      } catch (parseError) {
        // Если не удалось распарсить JSON, используем стандартное сообщение
      }
      
      throw new Error(errorMessage);
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
  create: (data: any) => fetchAPI<any>('/trainings/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
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
  getByTraining: (trainingId: string) => fetchAPI<any[]>(`/exercises/?training_id=${trainingId}`),
  
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
  // Регистрация
  register: (data: any) => fetchAPI<any>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Вход
  login: (data: any) => fetchAPI<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Выход
  logout: () => fetchAPI<void>('/auth/logout', {
    method: 'POST',
  }),
};