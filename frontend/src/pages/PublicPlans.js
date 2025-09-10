import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function PublicPlans() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [plans, setPlans] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        // Ensure authenticated
        await api.getMe();
        const res = await api.getPublicPlans();
        setPlans(res?.plans || []);
      } catch (e) {
        if (e.message.includes('401') || e.message.includes('authentication')) {
          navigate('/login', { replace: true });
        } else {
          setError(e.message || 'Failed to load public plans');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Error Loading Plans</h2>
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Public Study Plans</h2>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-xl font-semibold mb-4">Study Plans by Other Users</h3>
          <div className="mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search public plans by title, focus, outcome, or author..."
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
          {!plans.length ? (
            <p className="text-slate-400">No public study plans found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {plans
                .filter((plan) => {
                  if (!query.trim()) return true;
                  const q = query.toLowerCase();
                  return (
                    (plan.title || '').toLowerCase().includes(q) ||
                    (plan.focus || '').toLowerCase().includes(q) ||
                    (plan.outcome || '').toLowerCase().includes(q) ||
                    (plan.author_email || '').toLowerCase().includes(q)
                  );
                })
                .map((plan) => (
                <div key={plan.id} className="border border-slate-800 rounded-lg p-4 bg-slate-950 hover:bg-slate-900 transition-colors">
                  <div className="mb-3">
                    <h4 className="font-medium text-lg mb-1">{plan.title}</h4>
                    <p className="text-slate-400 text-sm mb-2">{plan.focus}</p>
                    <p className="text-slate-300 text-sm line-clamp-2">{plan.outcome}</p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                    <span>By: {plan.author_email}</span>
                    {plan.estimated_duration_weeks && (
                      <span>{plan.estimated_duration_weeks} weeks</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                    <Link
                      to={`/public/plans/${plan.id}`}
                      className="text-sky-400 hover:text-sky-300 text-sm font-medium"
                    >
                      View Details →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
