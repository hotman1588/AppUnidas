/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useLandingStore } from './store/useLandingStore';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LandingPageComponent4 from './pages/LandingPageComponent4';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import UserDashboard from './pages/UserDashboard';
import SurveyWizard from './pages/SurveyWizard';
import AdminDashboard from './pages/AdminDashboard';
import AnalystDashboard from './pages/AnalystDashboard';
import NewsPage from './pages/NewsPage';
import PublicSurveyTwoPage from './pages/PublicSurveyTwoPage';
import Footer from './components/Footer';

function PrivateRoute({ children, role }: { children: React.ReactNode, role?: string }) {
  const { user, loading } = useAuthStore();
  
  if (loading) return (
    <div className="min-h-screen bg-unidas-dark flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-unidas-primary/30 border-t-unidas-primary rounded-full animate-spin" />
    </div>
  );
  
  if (!user) return <Navigate to="/login" />;
  if (role && user?.role !== role) return <Navigate to="/" />;
  return <>{children}</>;
}

export default function App() {
  const { setLoading: setAuthLoading } = useAuthStore();
  const { fetchActiveLanding, loading: landingLoading, activeLanding } = useLandingStore();

  useEffect(() => {
    fetchActiveLanding().then(() => {
      setAuthLoading(false);
    });
  }, [fetchActiveLanding, setAuthLoading]);

  if (landingLoading) {
    return (
      <div className="min-h-screen bg-unidas-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-unidas-primary/30 border-t-unidas-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={
              activeLanding === 'component-4'
                ? <LandingPageComponent4 />
                : <LandingPage />
            } />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Encuesta Dos abierta al público: sin sesión ni restricción. */}
            <Route path="/encuesta-anonima" element={<PublicSurveyTwoPage />} />
            
            <Route path="/dashboard" element={
              <PrivateRoute role="user">
                <UserDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/survey" element={
              <PrivateRoute role="user">
                <SurveyWizard />
              </PrivateRoute>
            } />

            <Route path="/admin/*" element={
              <PrivateRoute role="admin">
                <AdminDashboard />
              </PrivateRoute>
            } />

            {/* Módulo de validación del recolector. /validacion es el endpoint
                canónico; /analyst se mantiene como alias por compatibilidad. */}
            <Route path="/validacion/*" element={
              <PrivateRoute role="analyst">
                <AnalystDashboard />
              </PrivateRoute>
            } />

            <Route path="/analyst/*" element={
              <PrivateRoute role="analyst">
                <AnalystDashboard />
              </PrivateRoute>
            } />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}
