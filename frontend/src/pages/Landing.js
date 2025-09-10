import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        await api.getMe();
        navigate('/dashboard', { replace: true });
      } catch (e) {
        // not logged in, stay on landing
      } finally {
        setChecking(false);
      }
    })();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto p-6">
        <header className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-semibold">Study Planner</h1>
          <div className="space-x-3">
            <Link to="/login" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm">Login</Link>
            <Link to="/register" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm">Register</Link>
          </div>
        </header>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8">
          <h2 className="text-3xl font-bold mb-3">Plan your learning, stay on track</h2>
          <p className="text-slate-300 mb-6 max-w-2xl">Generate a tailored study roadmap, track milestones, bookmark public plans, and stay accountable. Get started in minutes.</p>
          <div className="space-x-3">
            <Link to="/register" className="rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-3 text-sm font-medium">Get Started</Link>
            <Link to="/login" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-5 py-3 text-sm font-medium">I already have an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}


