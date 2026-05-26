import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, Sun, Moon, LogOut, Shield, UserCheck, Truck, PackagePlus } from 'lucide-react';

import Vendors from './pages/Vendors';
import ReceiveStock from './pages/ReceiveStock';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import POS from './pages/POS';
import Reports from './pages/Reports';

function ThemeToggle({ theme, toggleTheme }) {
  return (
    <button
      className="theme-toggle-btn"
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      <span className="theme-toggle-label">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
    </button>
  );
}

function OwnerRoute({ children }) {
  const { isOwner } = useAuth();
  return isOwner ? children : <Navigate to="/pos" replace />;
}

function Sidebar({ theme, toggleTheme }) {
  const { user, isOwner, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Package size={28} />
        <span>BizManager</span>
      </div>

      {/* User info */}
      <div className="sidebar-user-info">
        <div className="sidebar-user-avatar">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="sidebar-user-details">
          <span className="sidebar-user-name">{user?.name}</span>
          <span className={`sidebar-role-badge ${isOwner ? 'role-owner' : 'role-employee'}`}>
            {isOwner ? <><Shield size={11} /> Owner</> : <><UserCheck size={11} /> Employee</>}
          </span>
        </div>
      </div>
      <div className="sidebar-business-name">{user?.businessName}</div>

      <nav className="nav-menu">
        {isOwner && (
          <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
        )}
        <NavLink to="/inventory" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={20} /> Inventory
        </NavLink>
        {isOwner && (
          <>
            <NavLink to="/vendors" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <Truck size={20} /> Suppliers
            </NavLink>
            
            <NavLink to="/receive-stock" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
              <PackagePlus size={20} /> Receive Stock
            </NavLink>
          </>
        )}
        <NavLink to="/customers" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Customers
        </NavLink>
        <NavLink to="/pos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={20} /> POS & Cart
        </NavLink>
        {isOwner && (
          <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
            <BarChart3 size={20} /> Reports
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
        <button className="btn-logout" onClick={logout}>
          <LogOut size={18} /> Logout
        </button>
      </div>
    </aside>
  );
}

function AppContent() {
  const { isAuthenticated, loading, isOwner } = useAuth();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('bizmanager-theme') || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('bizmanager-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="app-loading">
        <Package size={48} className="app-loading-icon" />
        <p>Loading BizManager...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="app-container">
      <Sidebar theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={isOwner ? <Dashboard /> : <Navigate to="/pos" replace />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/vendors" element={<OwnerRoute><Vendors /></OwnerRoute>} />
          <Route path="/receive-stock" element={<OwnerRoute><ReceiveStock /></OwnerRoute>} />
          <Route path="/reports" element={<OwnerRoute><Reports /></OwnerRoute>} />
          <Route path="*" element={<Navigate to={isOwner ? "/" : "/pos"} replace />} />
        </Routes>
      </main>
      <button
        className="mobile-theme-fab"
        onClick={toggleTheme}
        title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}

export default App;
