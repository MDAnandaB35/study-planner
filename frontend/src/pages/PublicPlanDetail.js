import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api';
import RoadmapView from '../components/RoadmapView';

export default function PublicPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [plan, setPlan] = React.useState(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    (async () => {
      try {
        // Ensure authenticated
        await api.getMe();
        const res = await api.getPublicPlanById(id);
        setPlan(res?.plan || null);
      } catch (e) {
        if (e.message.includes('401') || e.message.includes('authentication')) {
          navigate('/login', { replace: true });
        } else {
          setError(e.message || 'Failed to load plan');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
      Loading...
    </div>
  );

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-4">Error Loading Plan</h2>
            <p className="text-slate-400 mb-4">{error}</p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm"
              >
                Try Again
              </button>
              <Link
                to="/public"
                className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm"
              >
                Back to Public Plans
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)} 
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm"
          >
            Back
          </button>
          <div className="flex items-center space-x-3">
            <div className="text-slate-400 text-sm">
              {plan ? new Date(plan.created_at).toLocaleString() : ''}
            </div>
            <Link 
              to="/public" 
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm"
            >
              Public Plans
            </Link>
          </div>
        </div>

        {plan && (
          <div className="mb-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">Study Plan by {plan.author_email}</h3>
                <p className="text-sm text-slate-400">This is a read-only view of another user's study plan</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">
                  {plan.estimated_duration_weeks && `${plan.estimated_duration_weeks} weeks`}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <RoadmapView plan={plan} readOnly={true} />
        </div>
      </div>
    </div>
  );
}
