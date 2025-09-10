import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function NavBar() {
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await api.logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="w-full bg-slate-900/80 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="text-slate-200 font-semibold">
          Study Planner
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm">My Plans</Link>
          <Link to="/public" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm">Public Plans</Link>
          <Link to="/bookmarks" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm">Bookmarked</Link>
          <Link to="/create" className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm">Create Plan</Link>
          <button onClick={onLogout} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-sm">Logout</button>
        </div>
      </div>
    </div>
  );
}


