import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import ExtinguishersPage from './pages/ExtinguishersPage';
import InspectionsPage from './pages/InspectionsPage';
import MaintenancePage from './pages/MaintenancePage';
import ReportsPage from './pages/ReportsPage';
import { ProfilePage, UsersPage } from './pages/UserPages';

// Protected layout: requires login
const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-orange-500"></div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen bg-gray-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

// Admin-only route guard
const AdminRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{ style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' } }}
      />
      <Routes>
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard"     element={<DashboardPage />} />
          <Route path="/extinguishers" element={<ExtinguishersPage />} />
          <Route path="/inspections"   element={<InspectionsPage />} />
          <Route path="/maintenance"   element={<MaintenancePage />} />
          <Route path="/reports"       element={<ReportsPage />} />
          <Route path="/profile"       element={<ProfilePage />} />
          <Route path="/users" element={
            <AdminRoute><UsersPage /></AdminRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  </AuthProvider>
);

export default App;
