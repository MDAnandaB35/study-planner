import React from 'react';
import api from '../api';

export default function EditPlanForm({ plan, onSave, onCancel }) {
  const [formData, setFormData] = React.useState({
    title: plan?.title || '',
    focus: plan?.focus || '',
    outcome: plan?.outcome || '',
    estimated_duration_weeks: plan?.estimated_duration_weeks || ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = {
        title: formData.title.trim(),
        focus: formData.focus.trim(),
        outcome: formData.outcome.trim(),
        estimated_duration_weeks: formData.estimated_duration_weeks ? parseInt(formData.estimated_duration_weeks) : null
      };

      await api.updatePlan(plan.id, data);
      onSave();
    } catch (err) {
      setError(err.message || 'Failed to update plan');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit Plan</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Focus</label>
            <input
              type="text"
              value={formData.focus}
              onChange={(e) => handleChange('focus', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Outcome</label>
            <input
              type="text"
              value={formData.outcome}
              onChange={(e) => handleChange('outcome', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Duration (weeks)</label>
            <input
              type="number"
              min="1"
              value={formData.estimated_duration_weeks}
              onChange={(e) => handleChange('estimated_duration_weeks', e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {error && (
            <div className="text-sm text-rose-300">{error}</div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm disabled:opacity-60"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
