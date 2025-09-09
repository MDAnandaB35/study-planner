import React from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [plans, setPlans] = React.useState([]);
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

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-200">
      Loading...
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <button onClick={onLogout} className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm">Logout</button>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 mb-6">
          <p className="mb-3">Welcome{user?.email ? `, ${user.email}` : ''}!</p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <h3 className="text-xl font-semibold mb-3">Your Study Plans</h3>
          {!plans.length ? (
            <p className="text-slate-400">No plans generated yet.</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {plans.map((p) => (
                <li key={p.id} className="py-3">
                  <Link to={`/plans/${p.id}`} className="block group">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium group-hover:text-sky-400">{p.title}</div>
                        <div className="text-slate-400 text-sm line-clamp-2">{p.outcome || p.focus}</div>
                      </div>
                      <div className="text-slate-500 text-xs ml-4">
                        {new Date(p.created_at).toLocaleString()}
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}


