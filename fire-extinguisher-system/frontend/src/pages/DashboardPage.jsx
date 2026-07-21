import React, { useEffect, useState } from 'react';
import { reportAPI } from '../services/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-gray-900 rounded-xl p-5 border border-gray-800`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs px-2 py-1 rounded-full ${color}`}>{label}</span>
    </div>
    <p className="text-3xl font-bold text-white">{value ?? '—'}</p>
  </div>
);

const COLORS = ['#f97316', '#22c55e', '#ef4444', '#6366f1'];

const DashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([reportAPI.summary(), reportAPI.stock()])
      .then(([s, st]) => { setSummary(s.data.data); setStock(st.data.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full text-gray-400">
      Loading dashboard...
    </div>
  );

  const typeData = stock?.by_type?.map(r => ({ name: r.type, value: parseInt(r.count) || 0 })) || [];
  const statusData = stock?.by_status?.map(r => ({ name: r.status, value: parseInt(r.count) || 0 })) || [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-500 text-sm">Fire Extinguisher Management Overview</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total"       value={summary?.extinguishers?.total}    icon="🧯" color="bg-blue-900 text-blue-300" />
        <StatCard label="Active"      value={summary?.extinguishers?.active}   icon="✅" color="bg-green-900 text-green-300" />
        <StatCard label="Expired"     value={summary?.extinguishers?.expired}  icon="⚠️" color="bg-red-900 text-red-300" />
        <StatCard label="Maintenance" value={summary?.extinguishers?.under_maintenance} icon="🔧" color="bg-yellow-900 text-yellow-300" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Inspections" value={summary?.inspections?.total}   icon="🔍" color="bg-purple-900 text-purple-300" />
        <StatCard label="Pending"     value={summary?.inspections?.pending} icon="⏳" color="bg-orange-900 text-orange-300" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Extinguishers by Type</h3>
          {typeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={typeData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {typeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-8">No data yet</p>}
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <h3 className="text-white font-semibold mb-4">Extinguishers by Status</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-gray-500 text-center py-8">No data yet</p>}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
