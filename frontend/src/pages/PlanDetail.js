import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import RoadmapView from '../components/RoadmapView';

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [plan, setPlan] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      try {
        // ensure authenticated
        await api.getMe();
        const res = await api.getPlanById(id);
        setPlan(res?.plan || null);
      } catch (e) {
        navigate('/login', { replace: true });
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm">Back</button>
          <div className="text-slate-400 text-sm">{plan ? new Date(plan.created_at).toLocaleString() : ''}</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <RoadmapView plan={plan} />
        </div>
      </div>
    </div>
  );
}


