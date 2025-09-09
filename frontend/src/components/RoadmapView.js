import React from 'react';

export default function RoadmapView({ plan }) {
  if (!plan) {
    return (
      <div className="text-slate-400">No plan generated yet.</div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <div className="text-lg font-medium">{plan.title}</div>
        <div className="text-slate-400 text-sm">Focus: {plan.focus} • Outcome: {plan.outcome}</div>
        {plan.estimated_duration_weeks ? (
          <div className="text-slate-400 text-sm">Estimated Duration: {plan.estimated_duration_weeks} weeks</div>
        ) : null}
      </div>
      <div className="space-y-4">
        {(plan.milestones || []).map((m) => (
          <div key={m.id} className="border border-slate-800 rounded-lg p-4 bg-slate-950">
            <div className="font-medium">{m.title}</div>
            {m.description ? (
              <div className="text-slate-400 text-sm mb-2">{m.description}</div>
            ) : null}
            {(m.steps || []).length ? (
              <ol className="list-decimal pl-5 space-y-2">
                {m.steps.map((s) => (
                  <li key={s.id}>
                    <div className="font-medium">{s.title}</div>
                    {s.description ? (
                      <div className="text-slate-400 text-sm">{s.description}</div>
                    ) : null}
                    {(s.resources || []).length ? (
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        {s.resources.map((r) => (
                          <li key={r.id} className="text-slate-300 text-sm">
                            <span className="uppercase text-xs text-slate-400 mr-2">{r.type}</span>
                            {r.url ? (
                              <a className="text-sky-400 hover:underline" href={r.url} target="_blank" rel="noreferrer">
                                {r.title || r.url}
                              </a>
                            ) : (
                              <span>{r.title}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-slate-500 text-sm">No steps</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


