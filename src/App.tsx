import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import TrainingsPage from './pages/TrainingsPage';
import TrainingDetailPage from './pages/TrainingDetailPage';
import AddTrainingPage from './pages/AddTrainingPage';
import EditTrainingPage from './pages/EditTrainingPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

const App: React.FunctionComponent = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-water-light">
          <Navigation />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/trainings" element={<TrainingsPage />} />
            <Route path="/add-training" element={<AddTrainingPage />} />
            <Route path="/edit-training/:id" element={<EditTrainingPage />} />
            <Route path="/training/:id" element={<TrainingDetailPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
