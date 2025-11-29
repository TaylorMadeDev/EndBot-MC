import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Accounts from './pages/Accounts';
import Bots from './pages/Bots';
import BotDetails from './pages/BotDetails';
import Tasks from './pages/Tasks';
import Marketplace from './pages/Marketplace';
import Macros from './pages/Macros';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import Landing from './pages/Landing';
import { useAuth } from './context/AuthContext';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <MainLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/app/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="accounts" element={<Accounts />} />
        <Route path="bots" element={<Bots />} />
        <Route path="bots/:id" element={<BotDetails />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="marketplace" element={<Marketplace />} />
        <Route path="macros" element={<Macros />} />
        <Route path="scheduler" element={<NotFound />} />
        <Route path="analytics" element={<NotFound />} />
        <Route path="pentest" element={<NotFound />} />
        <Route path="settings" element={<Settings />} />
        <Route path="help" element={<NotFound />} />
        <Route path="profile" element={<NotFound />} />
        <Route path="billing" element={<NotFound />} />
        <Route path="notifications" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
