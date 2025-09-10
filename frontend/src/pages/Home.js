import React from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Home() {
  const [focus, setFocus] = React.useState('');
  const [outcome, setOutcome] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [roadmap, setRoadmap] = React.useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setRoadmap(null);
    try {
      const res = await api.generateRoadmap(focus, outcome);
      setRoadmap(res?.roadmap || null);
    } catch (err) {
      setError(err.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-5xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Study Roadmap Builder AI</h1>
          <div className="text-sm text-slate-400 space-x-4">
            <Link className="hover:text-slate-200" to="/dashboard">My Plans</Link>
            <Link className="hover:text-slate-200" to="/public">Public Plans</Link>
            <button onClick={() => { api.logout(); window.location.href = '/login'; }} className="hover:text-slate-200">Logout</button>
          </div>
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

        {roadmap && (
          <div className="mt-8">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
              <div className="mb-6">
                <div className="text-sm text-slate-400">Plan</div>
                <div className="text-xl font-semibold">{roadmap.planTitle}</div>
                <div className="text-slate-400 mt-1">Focus: {roadmap.focus}</div>
                <div className="text-slate-400">Outcome: {roadmap.outcome}</div>
                {'estimatedDurationWeeks' in roadmap && (
                  <div className="text-slate-400">Duration: {roadmap.estimatedDurationWeeks} weeks</div>
                )}
              </div>

              {/* Roadmap graph-like layout */}
              <div className="relative">
                <div className="grid gap-8">
                  {(roadmap.milestones || []).map((m, idx) => (
                    <div key={idx} className="relative">
                      {/* connector line to next card */}
                      {idx < (roadmap.milestones.length - 1) && (
                        <div className="absolute left-1/2 top-full -translate-x-1/2 h-8 w-px bg-slate-700"></div>
                      )}
                      <div className="mx-auto max-w-3xl rounded-xl border border-slate-800 bg-slate-950 p-5 shadow">
                        <div className="flex items-start justify-between">
                          <div className="text-lg font-semibold">{m.title}</div>
                          {m.estimatedDuration && (
                            <span className="text-xs text-slate-400">{m.estimatedDuration}</span>
                          )}
                        </div>
                        {m.description && (
                          <p className="mt-2 text-slate-300">{m.description}</p>
                        )}
                        {(m.steps || []).length > 0 && (
                          <div className="mt-4">
                            <div className="text-sm text-slate-400 mb-2">Steps</div>
                            <ol className="grid gap-3">
                              {m.steps.map((s, sIdx) => (
                                <li key={sIdx} className="rounded-lg border border-slate-800 bg-slate-900 p-4">
                                  <div className="font-medium">{s.title}</div>
                                  {s.description && <div className="text-sm text-slate-300 mt-1">{s.description}</div>}
                                  {(s.resources || []).length > 0 && (
                                    <div className="mt-2 text-sm">
                                      <div className="text-slate-400">Resources</div>
                                      <ul className="list-disc list-inside">
                                        {s.resources.map((r, rIdx) => (
                                          <li key={rIdx} className="text-sky-300">
                                            {r.title}{r.url ? ' — ' : ''}
                                            {r.url && (
                                              <a className="underline" href={r.url} target="_blank" rel="noreferrer">
                                                {r.url}
                                              </a>
                                            )}
                                            {r.type && <span className="text-slate-400 ml-2">[{r.type}]</span>}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


