import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import EditPlanForm from '../components/EditPlanForm';

export default function Dashboard() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [plans, setPlans] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [editingPlan, setEditingPlan] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => {
      try {
        const res = await api.getMe();
        setUser(res?.user || null);
        // Fetch all plans for this user
        const list = await api.listPlans();
        setPlans(list?.plans || []);
      } catch (e) {
        navigate('/login', { replace: true });
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const onLogout = async () => {
    try {
      await api.logout();
    } finally {
      navigate('/login', { replace: true });
    }
  };

  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }

    try {
      await api.deletePlan(planId);
      // Refresh the plans list
      const list = await api.listPlans();
      setPlans(list?.plans || []);
    } catch (err) {
      alert('Failed to delete plan: ' + (err.message || 'Unknown error'));
    }
  };

  const handleSaveEdit = async () => {
    setEditingPlan(null);
    // Refresh the plans list
    const list = await api.listPlans();
    setPlans(list?.plans || []);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Study Plan List</h2>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-6">
          <p className="mb-3">Welcome{user?.email ? `, ${user.email}` : ''}!</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-xl font-semibold mb-3">Your Study Plans</h3>
          <div className="mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plans by title, focus, or outcome..."
              className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-2 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-600"
            />
          </div>
          {!plans.length ? (
            <p className="text-slate-400">No plans generated yet.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {plans
                .filter((p) => {
                  if (!query.trim()) return true;
                  const q = query.toLowerCase();
                  return (
                    (p.title || '').toLowerCase().includes(q) ||
                    (p.focus || '').toLowerCase().includes(q) ||
                    (p.outcome || '').toLowerCase().includes(q)
                  );
                })
                .map((p) => (
                <li key={p.id} className="py-3">
                  <div className="flex items-start justify-between">
                    <Link to={`/plans/${p.id}`} className="flex-1 group">
                      <div className="font-medium group-hover:text-sky-400">{p.title}</div>
                      <div className="text-slate-400 text-sm line-clamp-2">{p.outcome || p.focus}</div>
                    </Link>
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="text-slate-500 text-xs">
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditPlan(p);
                        }}
                        className="text-slate-400 hover:text-sky-400 text-sm px-2 py-1"
                      >
                        Edit
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeletePlan(p.id);
                        }}
                        className="text-slate-400 hover:text-rose-400 text-sm px-2 py-1"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {editingPlan && (
        <EditPlanForm
          plan={editingPlan}
          onSave={handleSaveEdit}
          onCancel={() => setEditingPlan(null)}
        />
      )}
    </div>
  );
}


