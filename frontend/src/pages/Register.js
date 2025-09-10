import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.signup(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/60 shadow-2xl p-7 text-slate-100">
        <h2 className="text-xl font-semibold">Create account</h2>
        <p className="text-sm text-slate-400 mt-1">Sign up with your email and password</p>
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
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>
        {error && <div className="mt-3 text-sm text-rose-300">{error}</div>}
        <div className="mt-5 text-sm text-slate-400">
          Already have an account? <Link className="text-sky-300 hover:underline" to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}


