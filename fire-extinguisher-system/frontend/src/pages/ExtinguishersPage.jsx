import React, { useEffect, useState } from 'react';
import { extAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY = { serial_number: '', type: 'Water', size: '5 lbs', location: '', installation_date: '', expiry_date: '', status: 'Active' };
const TYPES    = ['Water', 'CO2', 'Foam', 'Dry Chemical'];
const SIZES    = ['2.5 lbs', '5 lbs', '9 lbs', '12 lbs'];
const STATUSES = ['Active', 'Expired', 'Under Maintenance', 'Decommissioned'];

const statusBadge = (s) => {
  const map = { Active: 'bg-green-900 text-green-300', Expired: 'bg-red-900 text-red-300', 'Under Maintenance': 'bg-yellow-900 text-yellow-300', Decommissioned: 'bg-gray-700 text-gray-400' };
  return <span className={`text-xs px-2 py-1 rounded-full ${map[s] || 'bg-gray-700 text-gray-300'}`}>{s}</span>;
};

const ExtinguishersPage = () => {
  const { isInspector, isAdmin } = useAuth();
  const [data, setData] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    extAPI.getAll({ page, limit: 10, status: filterStatus || undefined, type: filterType || undefined })
      .then(r => { setData(r.data.data); setPagination(r.data.pagination); })
      .catch(() => toast.error('Failed to load extinguishers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, filterStatus, filterType]);

  const openAdd  = () => { setForm(EMPTY); setModal('add'); };
  const openEdit = (ext) => {
    setForm({
      ...ext,
      installation_date: ext.installation_date ? ext.installation_date.slice(0, 10) : '',
      expiry_date: ext.expiry_date ? ext.expiry_date.slice(0, 10) : ''
    });
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setForm(EMPTY); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modal === 'add') { await extAPI.create(form); toast.success('Extinguisher added!'); }
      else { await extAPI.update(form.id, form); toast.success('Extinguisher updated!'); }
      closeModal(); load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this extinguisher? This cannot be undone.')) return;
    try { await extAPI.remove(id); toast.success('Deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">🧯 Extinguishers</h2>
          <p className="text-gray-500 text-sm">Manage fire extinguisher inventory</p>
        </div>
        {isInspector && (
          <button onClick={openAdd}
            className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            + Add New
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }}
          className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-3 py-2 text-sm">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                {['Serial No', 'Type', 'Size', 'Location', 'Install Date', 'Expiry Date', 'Status', 'Actions'].map(h =>
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={8} className="text-center text-gray-500 py-8">Loading...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-gray-500 py-8">No extinguishers found</td></tr>
              ) : data.map(ext => (
                <tr key={ext.id} className="text-gray-300 hover:bg-gray-800/50 transition">
                  <td className="px-4 py-3 font-mono text-orange-400">{ext.serial_number}</td>
                  <td className="px-4 py-3">{ext.type}</td>
                  <td className="px-4 py-3">{ext.size}</td>
                  <td className="px-4 py-3">{ext.location}</td>
                  <td className="px-4 py-3">{ext.installation_date?.slice(0,10)}</td>
                  <td className="px-4 py-3">{ext.expiry_date?.slice(0,10)}</td>
                  <td className="px-4 py-3">{statusBadge(ext.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {isInspector && (
                        <button onClick={() => openEdit(ext)}
                          className="text-blue-400 hover:text-blue-300 text-xs px-2 py-1 rounded bg-blue-950">Edit</button>
                      )}
                      {isAdmin && (
                        <button onClick={() => handleDelete(ext.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-950">Del</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {pagination.pages > 1 && (
          <div className="px-4 py-3 border-t border-gray-800 flex items-center justify-between">
            <p className="text-xs text-gray-500">Total: {pagination.total}</p>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300 disabled:opacity-40">Prev</button>
              <span className="text-xs text-gray-400 py-1">Page {page} / {pagination.pages}</span>
              <button disabled={page >= pagination.pages} onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-300 disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl p-6 w-full max-w-lg border border-gray-700 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-5">
              {modal === 'add' ? 'Add New Extinguisher' : 'Edit Extinguisher'}
            </h3>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-xs text-gray-400">Serial Number</label>
                <input required value={form.serial_number} onChange={set('serial_number')}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400">Type</label>
                  <select value={form.type} onChange={set('type')}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                    {TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Size</label>
                  <select value={form.size} onChange={set('size')}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                    {SIZES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400">Location</label>
                <input required value={form.location} onChange={set('location')}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['installation_date','Installation Date'],['expiry_date','Expiry Date']].map(([k,l]) => (
                  <div key={k}>
                    <label className="text-xs text-gray-400">{l}</label>
                    <input type="date" required value={form[k]} onChange={set(k)}
                      className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-400">Status</label>
                <select value={form.status} onChange={set('status')}
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm transition">Cancel</button>
                <button type="submit" disabled={saving}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExtinguishersPage;
