import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import PlanDetail from './pages/PlanDetail';
import PublicPlans from './pages/PublicPlans';
import PublicPlanDetail from './pages/PublicPlanDetail';
import Bookmarked from './pages/Bookmarked';
import ProtectedRoute from './components/ProtectedRoute'; // For pages that require authentication
import Landing from './pages/Landing';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/create" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/plans/:id" element={<ProtectedRoute><PlanDetail /></ProtectedRoute>} />
        <Route path="/public" element={<ProtectedRoute><PublicPlans /></ProtectedRoute>} />
        <Route path="/public/plans/:id" element={<ProtectedRoute><PublicPlanDetail /></ProtectedRoute>} />
        <Route path="/bookmarks" element={<ProtectedRoute><Bookmarked /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
