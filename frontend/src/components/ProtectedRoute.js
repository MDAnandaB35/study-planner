import React from 'react';
import { Navigate } from 'react-router-dom';
import api from '../api';
import NavBar from './NavBar';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  // Check if user is authenticated
  React.useEffect(() => {
    (async () => {
      try {
        await api.getMe(); // API call to get user
        setIsAuthenticated(true);
      } catch (e) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <NavBar />
      {children}
    </div>
  );
}
