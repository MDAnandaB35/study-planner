import React from 'react';
import api from '../api';
import EditMilestoneForm from './EditMilestoneForm';
import EditStepForm from './EditStepForm';
import EditResourceForm from './EditResourceForm';
import AddMilestoneForm from './AddMilestoneForm';
import AddStepForm from './AddStepForm';
import AddResourceForm from './AddResourceForm';

export default function RoadmapView({ plan, onPlanUpdate, readOnly = false, progress }) {
  // Get youtube video id from url
  const getYouTubeVideoId = (urlString) => {
    if (!urlString) return '';
    try {
      const url = new URL(urlString);
      const host = url.hostname.replace(/^www\./, '');
      // youtu.be/<id>
      if (host === 'youtu.be') {
        return url.pathname.replace('/', '') || '';
      }
      // youtube.com/watch?v=<id>
      if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtube-nocookie.com') {
        return url.searchParams.get('v') || '';
      }
      // www.youtube.com
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
  const [editingMilestone, setEditingMilestone] = React.useState(null);
  const [editingStep, setEditingStep] = React.useState(null);
  const [editingResource, setEditingResource] = React.useState(null);
  const [addingMilestone, setAddingMilestone] = React.useState(false);
  const [addingStep, setAddingStep] = React.useState(null);
  const [addingResource, setAddingResource] = React.useState(null);

  if (!plan) {
    return (
      <div className="text-slate-400">No plan generated yet.</div>
    );
  }

  const handleDeleteMilestone = async (milestoneId) => {
    if (!window.confirm('Are you sure you want to delete this milestone? This will also delete all its steps and resources.')) {
      return;
    }

    try {
      await api.deleteMilestone(milestoneId);
      onPlanUpdate();
    } catch (err) {
      alert('Failed to delete milestone: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteStep = async (stepId) => {
    if (!window.confirm('Are you sure you want to delete this step? This will also delete all its resources.')) {
      return;
    }

    try {
      await api.deleteStep(stepId);
      onPlanUpdate();
    } catch (err) {
      alert('Failed to delete step: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) {
      return;
    }

    try {
      await api.deleteResource(resourceId);
      onPlanUpdate();
    } catch (err) {
      alert('Failed to delete resource: ' + (err.message || 'Unknown error'));
    }
  };

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
        {(plan.milestones || []).map((m) => {
          const isCompleted = Array.isArray(progress?.completedIds) && progress.completedIds.includes(m.id);
          const toggleable = readOnly && progress && typeof progress?.setCompletedIds === 'function' && progress?.planId;
          return (
          <div key={m.id} className="border border-slate-800 rounded-lg p-4 bg-slate-950">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
              <div className="flex-1">
                <div className="font-medium flex items-start gap-2">
                  {toggleable && (
                    <input
                      type="checkbox"
                      className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-500 focus:ring-emerald-600"
                      checked={!!isCompleted}
                      onChange={async (e) => {
                        const next = e.target.checked;
                        try {
                          await api.setPublicPlanProgress(progress.planId, m.id, next);
                          progress.setCompletedIds((prev) => {
                            const set = new Set(prev || []);
                            if (next) set.add(m.id); else set.delete(m.id);
                            return Array.from(set);
                          });
                        } catch (err) {
                          alert(err.message || 'Failed to update progress');
                        }
                      }}
                    />
                  )}
                  <span className={isCompleted ? 'line-through text-slate-400' : ''}>{m.title}</span>
                </div>
                {m.description ? (
                  <div className="text-slate-400 text-sm mb-2">{m.description}</div>
                ) : null}
                {m.estimated_duration && (
                  <div className="text-slate-500 text-xs">{m.estimated_duration}</div>
                )}
              </div>
              {!readOnly && (
                <div className="flex flex-wrap items-center gap-1 sm:gap-2 sm:ml-4">
                  <button
                    onClick={() => setEditingMilestone(m)}
                    className="text-slate-400 hover:text-sky-400 text-xs px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteMilestone(m.id)}
                    className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => setAddingStep(m.id)}
                    className="text-slate-400 hover:text-green-400 text-xs px-2 py-1"
                  >
                    + Step
                  </button>
                </div>
              )}
            </div>

            {(m.steps || []).length ? (
              <ol className="list-decimal pl-5 space-y-2">
                {m.steps.map((s) => (
                  <li key={s.id} className="border-l border-slate-700 pl-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium">{s.title}</div>
                        {s.description ? (
                          <div className="text-slate-400 text-sm">{s.description}</div>
                        ) : null}
                        {(s.resources || []).length ? (
                          <ul className="list-disc pl-5 mt-1 space-y-1">
                            {s.resources.map((r) => {
                              const ytId = getYouTubeVideoId(r.url);
                              const thumb = getYouTubeThumbnailUrl(ytId);
                              return (
                              <li key={r.id} className="text-slate-300 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <div className="flex items-center gap-3">
                                  {thumb ? (
                                    <a href={r.url} target="_blank" rel="noreferrer" className="shrink-0">
                                      <img src={thumb} alt="YouTube thumbnail" className="h-16 w-28 object-cover rounded border border-slate-800" />
                                    </a>
                                  ) : null}
                                  <div>
                                    <span className="uppercase text-xs text-slate-400 mr-2">{r.type}</span>
                                    {r.url ? (
                                      <a className="text-sky-400 hover:underline" href={r.url} target="_blank" rel="noreferrer">
                                        {r.title || r.url}
                                      </a>
                                    ) : (
                                      <span>{r.title}</span>
                                    )}
                                  </div>
                                </div>
                                {!readOnly && (
                                  <div className="flex flex-wrap items-center gap-1 sm:ml-2">
                                    <button
                                      onClick={() => setEditingResource(r)}
                                      className="text-slate-400 hover:text-sky-400 text-xs px-1"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteResource(r.id)}
                                      className="text-slate-400 hover:text-rose-400 text-xs px-1"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </li>
                            );})}
                          </ul>
                        ) : null}
                      </div>
                      {!readOnly && (
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2 sm:ml-4">
                          <button
                            onClick={() => setEditingStep(s)}
                            className="text-slate-400 hover:text-sky-400 text-xs px-2 py-1"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStep(s.id)}
                            className="text-slate-400 hover:text-rose-400 text-xs px-2 py-1"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setAddingResource(s.id)}
                            className="text-slate-400 hover:text-green-400 text-xs px-2 py-1"
                          >
                            + Resource
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-slate-500 text-sm">No steps</div>
            )}
          </div>
          );
        })}

        {!readOnly && (
          <div className="flex justify-center pt-4">
            <button
              onClick={() => setAddingMilestone(true)}
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm text-slate-300 w-full sm:w-auto"
            >
              + Add Milestone
            </button>
          </div>
        )}
      </div>

      {/* Edit Forms - Only show in non-read-only mode */}
      {!readOnly && editingMilestone && (
        <EditMilestoneForm
          milestone={editingMilestone}
          onSave={() => {
            setEditingMilestone(null);
            onPlanUpdate();
          }}
          onCancel={() => setEditingMilestone(null)}
        />
      )}

      {!readOnly && editingStep && (
        <EditStepForm
          step={editingStep}
          onSave={() => {
            setEditingStep(null);
            onPlanUpdate();
          }}
          onCancel={() => setEditingStep(null)}
        />
      )}

      {!readOnly && editingResource && (
        <EditResourceForm
          resource={editingResource}
          onSave={() => {
            setEditingResource(null);
            onPlanUpdate();
          }}
          onCancel={() => setEditingResource(null)}
        />
      )}

      {/* Add Forms - Only show in non-read-only mode */}
      {!readOnly && addingMilestone && (
        <AddMilestoneForm
          planId={plan.id}
          onSave={() => {
            setAddingMilestone(false);
            onPlanUpdate();
          }}
          onCancel={() => setAddingMilestone(false)}
        />
      )}

      {!readOnly && addingStep && (
        <AddStepForm
          milestoneId={addingStep}
          onSave={() => {
            setAddingStep(null);
            onPlanUpdate();
          }}
          onCancel={() => setAddingStep(null)}
        />
      )}

      {!readOnly && addingResource && (
        <AddResourceForm
          stepId={addingResource}
          onSave={() => {
            setAddingResource(null);
            onPlanUpdate();
          }}
          onCancel={() => setAddingResource(null)}
        />
      )}
    </div>
  );
}


