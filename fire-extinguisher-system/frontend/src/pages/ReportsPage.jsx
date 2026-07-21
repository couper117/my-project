import React, { useEffect, useState } from 'react';
import { reportAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from 'react-hot-toast';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ReportsPage = () => {
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState('daily');
  const [dailyDate, setDailyDate] = useState(new Date().toISOString().slice(0,10));
  const [monthYear, setMonthYear] = useState(new Date().getFullYear());
  const [monthMonth, setMonthMonth] = useState(new Date().getMonth() + 1);
  const [yearYear, setYearYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadReport = async () => {
    setLoading(true);
    try {
      let res;
      if (tab === 'daily')   res = await reportAPI.daily({ date: dailyDate });
      if (tab === 'monthly') res = await reportAPI.monthly({ year: monthYear, month: monthMonth });
      if (tab === 'yearly')  res = await reportAPI.yearly({ year: yearYear });
      setReport(res.data);
    } catch { toast.error('Failed to load report'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadReport(); }, [tab]);

  const handleExport = async () => {
    try {
      const res = await reportAPI.exportCSV();
      // If responseType is 'blob', res.data is already a Blob
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extinguishers-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('CSV downloaded!');
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    }
  };

  const yearlyData = report?.data?.inspections_by_month?.map(r => ({
    month: MONTHS[(r.month - 1) % 12] || `Month ${r.month}`, inspections: r.count, passed: r.passed, failed: r.failed
  })) || [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">📈 Reports</h2>
          <p className="text-gray-500 text-sm">Real-time activity reports</p>
        </div>
        {isAdmin && (
          <button onClick={handleExport}
            className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            ⬇️ Export CSV
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
        {['daily','monthly','yearly'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${tab === t ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-end">
        {tab === 'daily' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Date</label>
            <input type="date" value={dailyDate} onChange={e => setDailyDate(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          </div>
        )}
        {tab === 'monthly' && (
          <>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Year</label>
              <input type="number" value={monthYear} onChange={e => setMonthYear(e.target.value)} min="2020" max="2099"
                className="w-28 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Month</label>
              <select value={monthMonth} onChange={e => setMonthMonth(e.target.value)}
                className="bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500">
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
          </>
        )}
        {tab === 'yearly' && (
          <div>
            <label className="text-xs text-gray-400 block mb-1">Year</label>
            <input type="number" value={yearYear} onChange={e => setYearYear(e.target.value)} min="2020" max="2099"
              className="w-28 bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500" />
          </div>
        )}
        <button onClick={loadReport}
          className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          Generate
        </button>
      </div>

      {loading && <p className="text-gray-500">Generating report...</p>}

      {report && !loading && (
        <div className="space-y-4">
          {(tab === 'daily' || tab === 'monthly') && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Inspections</p>
                  <p className="text-3xl font-bold text-white">{report.data?.inspections?.length ?? 0}</p>
                </div>
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <p className="text-gray-400 text-sm mb-1">Maintenance Activities</p>
                  <p className="text-3xl font-bold text-white">{report.data?.maintenance?.length ?? 0}</p>
                </div>
              </div>

              {report.data?.inspections?.length > 0 && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-800">
                    <h3 className="text-white font-semibold text-sm">Inspections</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-800 text-gray-400 text-xs"><tr>
                        {['Serial No','Location','Inspector','Date','Status'].map(h =>
                          <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                      </tr></thead>
                      <tbody className="divide-y divide-gray-800">
                        {report.data.inspections.map(i => (
                          <tr key={i.id} className="text-gray-300">
                            <td className="px-4 py-3 font-mono text-orange-400">{i.serial_number}</td>
                            <td className="px-4 py-3">{i.location}</td>
                            <td className="px-4 py-3">{i.first_name} {i.last_name}</td>
                            <td className="px-4 py-3">{new Date(i.inspection_date).toLocaleDateString()}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${i.status==='Pass'?'bg-green-900 text-green-300':i.status==='Fail'?'bg-red-900 text-red-300':'bg-yellow-900 text-yellow-300'}`}>{i.status}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {tab === 'yearly' && yearlyData.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
              <h3 className="text-white font-semibold mb-4">Inspections by Month — {yearYear}</h3>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151' }} />
                  <Line type="monotone" dataKey="inspections" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
                  <Line type="monotone" dataKey="passed" stroke="#22c55e" strokeWidth={2} />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3 text-xs">
                <span className="flex items-center gap-1 text-orange-400">● Total</span>
                <span className="flex items-center gap-1 text-green-400">● Passed</span>
                <span className="flex items-center gap-1 text-red-400">● Failed</span>
              </div>
            </div>
          )}

          {tab === 'yearly' && report.data?.expired_extinguishers?.length > 0 && (
            <div className="bg-gray-900 rounded-xl border border-gray-800">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">Expired Extinguishers in {yearYear}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-800 text-gray-400 text-xs"><tr>
                    {['Serial No','Type','Size','Location','Expiry Date'].map(h =>
                      <th key={h} className="px-4 py-3 text-left">{h}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-gray-800">
                    {report.data.expired_extinguishers.map(e => (
                      <tr key={e.id} className="text-gray-300">
                        <td className="px-4 py-3 font-mono text-orange-400">{e.serial_number}</td>
                        <td className="px-4 py-3">{e.type}</td>
                        <td className="px-4 py-3">{e.size}</td>
                        <td className="px-4 py-3">{e.location}</td>
                        <td className="px-4 py-3 text-red-400">{e.expiry_date ? e.expiry_date.slice(0, 10) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
