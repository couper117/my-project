import React, { useEffect, useState } from 'react';
import { inspectionAPI, extAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const statusBadge = (s) => {
  const map = { Pass: 'bg-green-900 text-green-300', Fail: 'bg-red-900 text-red-300', Pending: 'bg-yellow-900 text-yellow-300' };
  return <span className={`text-xs px-2 py-1 rounded-full ${map[s] || 'bg-gray-700 text-gray-300'}`}>{s}</span>;
};

const InspectionsPage = () => {
  const { isInspector } = useAuth();
  const [data, setData] = useState([]);
  const [extinguishers, setExtinguishers] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'log' | 'schedule'
  const [form, setForm] = useState({ extinguisher_id: '', inspection_date: '', status: 'Pass', notes: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    inspectionAPI.getAll({ page, limit: 10 })
      .then(r => { setData(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); extAPI.getAll({ limit: 100 }).then(r => setExtinguishers(r.data.data)); }, [page]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'schedule') {
        await inspectionAPI.schedule({ extinguisher_id: form.extinguisher_id, scheduled_date: form.inspection_date, notes: form.notes });
        toast.success('Inspection scheduled!');
      } else {
        await inspectionAPI.create(form);
        toast.success('Inspection logged!');
      }
      setModal(null); setForm({ extinguisher_id: '', inspection_date: '', status: 'Pass', notes: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🔍 Inspections</h2>
          <p className="text-gray-500 text-sm">View and manage inspection records</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setModal('schedule')}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            📅 Schedule
          </button>
          {isInspector && (
            <button onClick={() => setModal('log')}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              + Log Result
            </button>
          )}
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                {['#', 'Extinguisher', 'Location', 'Inspector', 'Date', 'Status', 'Notes'].map(h =>
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-gray-500 py-8">No inspections found</td></tr>
              ) : data.map(ins => (
                <tr key={ins.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-500">{ins.id}</td>
                  <td className="px-4 py-3 font-mono text-orange-400">{ins.serial_number}</td>
                  <td className="px-4 py-3">{ins.location}</td>
                  <td className="px-4 py-3">{ins.first_name} {ins.last_name}</td>
                  <td className="px-4 py-3">{new Date(ins.inspection_date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{statusBadge(ins.status)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate">{ins.notes || '—'}</td>
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
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-5">
              {modal === 'log' ? 'Log Inspection Result' : 'Schedule Inspection'}
            </h3>
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
                <label className="text-xs text-gray-400">{modal === 'schedule' ? 'Scheduled Date' : 'Inspection Date'}</label>
                <input type="datetime-local" required value={form.inspection_date} onChange={set('inspection_date')}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              {modal === 'log' && (
                <div>
                  <label className="text-xs text-gray-400">Status</label>
                  <select value={form.status} onChange={set('status')}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                    <option>Pass</option><option>Fail</option><option>Pending</option>
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-400">Notes</label>
                <textarea value={form.notes} onChange={set('notes')} rows={3}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setModal(null)}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                  {saving ? 'Saving...' : modal === 'schedule' ? 'Schedule' : 'Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionsPage;
