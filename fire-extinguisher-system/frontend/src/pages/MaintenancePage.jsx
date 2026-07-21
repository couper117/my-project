import React, { useEffect, useState } from 'react';
import { maintenanceAPI, extAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const MaintenancePage = () => {
  const { isInspector } = useAuth();
  const [data, setData] = useState([]);
  const [extinguishers, setExtinguishers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({
    extinguisher_id: '', maintenance_date: '', action_taken: '', notes: '', next_maintenance_date: ''
  });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    maintenanceAPI.getAll({ page, limit: 10 })
      .then(r => { setData(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); extAPI.getAll({ limit: 100 }).then(r => setExtinguishers(r.data.data)); }, [page]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await maintenanceAPI.create(form);
      toast.success('Maintenance activity logged!');
      setModal(false);
      setForm({ extinguisher_id: '', maintenance_date: '', action_taken: '', notes: '', next_maintenance_date: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🔧 Maintenance</h2>
          <p className="text-gray-500 text-sm">Log and view maintenance activities</p>
        </div>
        {isInspector && (
          <button onClick={() => setModal(true)}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Log Activity
          </button>
        )}
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                {['#', 'Extinguisher', 'Location', 'Inspector', 'Date', 'Action Taken', 'Next Maintenance'].map(h =>
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">No maintenance records yet</td></tr>
              ) : data.map(m => (
                <tr key={m.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-500">{m.id}</td>
                  <td className="px-4 py-3 font-mono text-orange-400">{m.serial_number}</td>
                  <td className="px-4 py-3">{m.location}</td>
                  <td className="px-4 py-3">{m.first_name} {m.last_name}</td>
                  <td className="px-4 py-3">{new Date(m.maintenance_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="truncate text-xs">{m.action_taken}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{m.next_maintenance_date ? m.next_maintenance_date.slice(0, 10) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800 flex justify-between items-center">
            <p className="text-xs text-gray-500">Total: {pagination.total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300 disabled:opacity-40">Prev</button>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-5">Log Maintenance Activity</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400">Extinguisher</label>
                <select required value={form.extinguisher_id} onChange={set('extinguisher_id')}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                  <option value="">Select extinguisher...</option>
                  {extinguishers.map(e => <option key={e.id} value={e.id}>{e.serial_number} — {e.location}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-400">Maintenance Date</label>
                <input type="datetime-local" required value={form.maintenance_date} onChange={set('maintenance_date')}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Action Taken</label>
                <textarea required value={form.action_taken} onChange={set('action_taken')} rows={3}
                  placeholder="Describe maintenance actions performed..."
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Notes (optional)</label>
                <textarea value={form.notes} onChange={set('notes')} rows={2}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" />
              </div>
              <div>
                <label className="text-xs text-gray-400">Next Maintenance Date (optional)</label>
                <input type="date" value={form.next_maintenance_date} onChange={set('next_maintenance_date')}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(false)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : 'Log Activity'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenancePage;
