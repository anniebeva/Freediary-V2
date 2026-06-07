import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import PrivateRoute from './components/PrivateRoute';
import HomePage from './pages/HomePage';
import TrainingsPage from './pages/TrainingsPage';
import TrainingDetailPage from './pages/TrainingDetailPage';
import AddTrainingPage from './pages/AddTrainingPage';
import EditTrainingPage from './pages/EditTrainingPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Компонент для отслеживания просмотров страниц
const TrackPageViews: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    // Отправляем просмотр страницы в Яндекс Метрику при каждом изменении URL
    if (window.ym) {
      window.ym(109707102, 'hit', window.location.href);
    }
  }, [location]);

  return null;
};

// Основной компонент с роутингом
const AppRoutes: React.FC = () => {
  return (
    <>
      <TrackPageViews />
      <Routes>
        <Route path="/" element={<HomePage />} />
        
        {/* Защищенные маршруты */}
        <Route path="/trainings" element={
          <PrivateRoute>
            <TrainingsPage />
          </PrivateRoute>
        } />
        <Route path="/add-training" element={
          <PrivateRoute>
            <AddTrainingPage />
          </PrivateRoute>
        } />
        <Route path="/trainings/:id/edit" element={
          <PrivateRoute>
            <EditTrainingPage />
          </PrivateRoute>
        } />
        <Route path="/training/:id" element={
          <PrivateRoute>
            <TrainingDetailPage />
          </PrivateRoute>
        } />
        <Route path="/stats" element={
          <PrivateRoute>
            <StatsPage />
          </PrivateRoute>
        } />
        <Route path="/profile" element={
          <PrivateRoute>
            <ProfilePage />
          </PrivateRoute>
        } />
        
        {/* Маршруты только для неавторизованных */}
        <Route path="/login" element={
          <PrivateRoute requireAuth={false}>
            <LoginPage />
          </PrivateRoute>
        } />
        <Route path="/register" element={
          <PrivateRoute requireAuth={false}>
            <RegisterPage />
          </PrivateRoute>
        } />
      </Routes>
    </>
  );
};

const App: React.FunctionComponent = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-water-light">
          <Navigation />
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;