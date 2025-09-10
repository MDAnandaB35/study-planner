import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

export default function Bookmarked() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [plans, setPlans] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      // Ensure authenticated
      try {
        await api.getMe();
        const res = await api.listBookmarks();
        setPlans(res?.plans || []);
      } catch (e) {
        if (e.message.includes('401') || e.message.includes('authentication')) {
          navigate('/login', { replace: true });
        } else {
          setError(e.message || 'Failed to load bookmarks');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">Loading...</div>
  );

  // Error loading bookmarks
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Error Loading Bookmarks</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show bookmarks
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Bookmarked Plans</h2>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          {!plans.length ? (
            <p className="text-slate-400">No bookmarks yet.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="md:col-span-2 lg:col-span-3 mb-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bookmarks by title, focus, or outcome..."
                  className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-600"
                />
              </div>
              {plans
                .filter((plan) => {
                  if (!query.trim()) return true;
                  const q = query.toLowerCase();
                  return (
                    (plan.title || '').toLowerCase().includes(q) ||
                    (plan.focus || '').toLowerCase().includes(q) ||
                    (plan.outcome || '').toLowerCase().includes(q)
                  );
                })
                .map((plan) => {
                // Calculate progress percentage
                const completed = plan?.progress?.completed || 0;
                const total = plan?.progress?.total || 0;
                const percent = total ? Math.round((completed / total) * 100) : 0;
                return (
                  <div key={plan.id} className="border border-slate-800 rounded-lg p-4 bg-slate-950">
                    <div className="mb-3">
                      <h4 className="font-medium text-lg mb-1">{plan.title}</h4>
                      <p className="text-slate-400 text-sm mb-2">{plan.focus}</p>
                      <p className="text-slate-300 text-sm line-clamp-2">{plan.outcome}</p>
                    </div>
                    <div className="mb-3">
                      <div className="h-2 w-full bg-slate-800 rounded">
                        <div className="h-2 bg-emerald-600 rounded" style={{ width: `${percent}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-slate-400">{percent}% complete ({completed}/{total} milestones)</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-500">{new Date(plan.created_at).toLocaleDateString()}</span>
                      <Link to={`/public/plans/${plan.id}`} className="text-sky-400 hover:text-sky-300 text-sm font-medium">View →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



