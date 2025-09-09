import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl p-7 text-slate-100">
        <h2 className="text-xl font-semibold">Welcome back</h2>
        <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <label className="text-xs text-slate-400">Email</label>
          <input
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="text-xs text-slate-400 mt-2">Password</label>
          <input
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-4 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-3 font-medium hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        {error && <div className="mt-3 text-sm text-rose-300">{error}</div>}
        <div className="mt-5 text-sm text-slate-400">
          New here? <Link className="text-sky-300 hover:underline" to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}


