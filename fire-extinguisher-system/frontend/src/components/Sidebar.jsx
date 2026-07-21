import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? 'bg-orange-600 text-white'
          : 'text-gray-400 hover:text-white hover:bg-gray-800'
      }`
    }
  >
    <span className="text-lg">{icon}</span>
    {label}
  </NavLink>
);

const Sidebar = () => {
  const { user, logout, isAdmin, isInspector } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-64 min-h-screen bg-gray-900 border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <h1 className="font-bold text-white text-sm">TZW LTD</h1>
            <p className="text-gray-500 text-xs">Fire Safety System</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs text-gray-600 uppercase tracking-wider mb-2 px-2">Overview</p>
        <NavItem to="/dashboard" icon="📊" label="Dashboard" />

        <p className="text-xs text-gray-600 uppercase tracking-wider mt-4 mb-2 px-2">Management</p>
        <NavItem to="/extinguishers" icon="🧯" label="Extinguishers" />
        <NavItem to="/inspections"   icon="🔍" label="Inspections" />
        <NavItem to="/maintenance"   icon="🔧" label="Maintenance" />

        <p className="text-xs text-gray-600 uppercase tracking-wider mt-4 mb-2 px-2">Analytics</p>
        <NavItem to="/reports" icon="📈" label="Reports" />

        {isAdmin && (
          <>
            <p className="text-xs text-gray-600 uppercase tracking-wider mt-4 mb-2 px-2">Admin</p>
            <NavItem to="/users" icon="👥" label="Users" />
          </>
        )}

        <p className="text-xs text-gray-600 uppercase tracking-wider mt-4 mb-2 px-2">Account</p>
        <NavItem to="/profile" icon="👤" label="My Profile" />
      </nav>

      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.first_name?.[0]}{user?.last_name?.[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.first_name} {user?.last_name}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full text-sm text-red-400 hover:text-red-300 hover:bg-red-950 py-2 rounded-lg transition text-left px-3"
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
