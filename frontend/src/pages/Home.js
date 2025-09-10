import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

// Generate roadmap
export default function Home() {
  const navigate = useNavigate();
  const [focus, setFocus] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.generateRoadmap(focus, outcome);
      // Fetch latest created plan and redirect to its detail view
      try {
        const latest = await api.getLatestPlan();
        const planId = latest?.plan?.id;
        if (planId) {
          navigate(`/plans/${planId}`, { replace: true });
          return;
        }
      } catch {}
      // Fallback if latest plan not available
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  // Get youtube video id from url
  const getYouTubeVideoId = (urlString) => {
    if (!urlString) return '';
    try {
      const url = new URL(urlString);
      const host = url.hostname.replace(/^www\./, '');
      if (host === 'youtu.be') {
        return url.pathname.replace('/', '') || '';
      }
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        return url.searchParams.get('v') || '';
      }
      if (host === 'youtube.com' || host === 'www.youtube.com') {
        return url.searchParams.get('v') || '';
      }
      return '';
    } catch {
      return '';
    }
  };

  // Return youtube thumbnail url from video id
  const getYouTubeThumbnailUrl = (videoId) => {
    if (!videoId) return '';
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  };

  // Show form
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Study Roadmap Builder AI</h1>
        </header>

        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 grid gap-3">
          <label className="text-xs text-slate-400">Focus</label>
          <input
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g., Learn React with TypeScript"
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            required
          />
          <label className="text-xs text-slate-400 mt-2">Expected outcome</label>
          <input
            className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="e.g., Build a production-ready dashboard"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-lg bg-gradient-to-r from-indigo-600 to-violet-600 py-3 font-medium hover:opacity-95 disabled:opacity-60"
          >
            {loading ? 'Generating…' : 'Generate roadmap'}
          </button>
          {error && <div className="text-sm text-rose-300">{error}</div>}
        </form>

        {/* No preview; redirect to plan detail after generation */}
      </div>
    </div>
  );
}


