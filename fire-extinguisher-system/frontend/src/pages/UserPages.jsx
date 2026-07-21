import React, { useEffect, useState } from 'react';
import { authAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [tab, setTab] = useState('info');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authAPI.profile().then(r => {
      setProfile(r.data.data);
      setForm({ first_name: r.data.data.first_name, last_name: r.data.data.last_name, email: r.data.data.email });
    });
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await authAPI.updateProfile(form); toast.success('Profile updated!'); }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const handlePassword = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await authAPI.changePassword(pwForm); toast.success('Password changed!'); setPwForm({ current_password: '', new_password: '' }); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  if (!profile) return <div className="p-6 text-gray-500">Loading...</div>;

  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-2xl font-bold text-white mb-6">👤 My Profile</h2>

      <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center text-white text-2xl font-bold">
            {profile.first_name?.[0]}{profile.last_name?.[0]}
          </div>
          <div>
            <p className="text-white text-lg font-semibold">{profile.first_name} {profile.last_name}</p>
            <p className="text-gray-400 text-sm">{profile.email}</p>
            <span className="text-xs bg-orange-900 text-orange-300 px-2 py-0.5 rounded-full mt-1 inline-block">{profile.role}</span>
          </div>
        </div>

        <div className="flex border-b border-gray-800">
          {['info', 'password'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium capitalize transition ${tab === t ? 'text-orange-400 border-b-2 border-orange-500' : 'text-gray-500 hover:text-gray-300'}`}>
              {t === 'info' ? 'Edit Info' : 'Change Password'}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'info' && (
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[['first_name','First Name'],['last_name','Last Name']].map(([k,l]) => (
                  <div key={k}>
                    <label className="text-xs text-gray-400">{l}</label>
                    <input value={form[k]} onChange={e => setForm({...form,[k]:e.target.value})} required
                      className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-xs text-gray-400">Email</label>
                <input type="email" value={form.email} onChange={e => setForm({...form,email:e.target.value})} required
                  className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
              </div>
              <button type="submit" disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Update Profile'}
              </button>
            </form>
          )}
          {tab === 'password' && (
            <form onSubmit={handlePassword} className="space-y-4">
              {[['current_password','Current Password'],['new_password','New Password']].map(([k,l]) => (
                <div key={k}>
                  <label className="text-xs text-gray-400">{l}</label>
                  <input type="password" required value={pwForm[k]} onChange={e => setPwForm({...pwForm,[k]:e.target.value})}
                    className="w-full mt-1 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
                </div>
              ))}
              <button type="submit" disabled={saving}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                {saving ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    userAPI.getAll().then(r => setUsers(r.data.data)).catch(() => toast.error('Failed to load')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleRoleChange = async (id, role) => {
    try { await userAPI.updateRole(id, role); toast.success('Role updated'); load(); }
    catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this user?')) return;
    try { await userAPI.remove(id); toast.success('User deleted'); load(); }
    catch { toast.error('Cannot delete'); }
  };

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-white">👥 Users</h2>
        <p className="text-gray-500 text-sm">Manage system users and roles</p>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-800 text-gray-400 text-xs uppercase">
              <tr>
                {['#', 'Name', 'Email', 'Role', 'Joined', 'Actions'].map(h =>
                  <th key={h} className="px-4 py-3 text-left">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={6} className="text-center text-gray-500 py-8">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u.id} className="text-gray-300 hover:bg-gray-800/50">
                  <td className="px-4 py-3 text-gray-500">{u.id}</td>
                  <td className="px-4 py-3">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-3 text-gray-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 text-gray-300 rounded px-2 py-1 text-xs focus:outline-none">
                      {['Admin','Inspector','User'].map(r => <option key={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(u.id)}
                      className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded bg-red-950">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
