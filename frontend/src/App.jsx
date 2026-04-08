import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, ShoppingCart, BarChart3, Sun, Moon } from 'lucide-react';

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

function Sidebar({ theme, toggleTheme }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Package size={28} />
        <span>BizManager</span>
      </div>
      <nav className="nav-menu">
        <NavLink to="/" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={20} /> Dashboard
        </NavLink>
        <NavLink to="/inventory" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Package size={20} /> Inventory
        </NavLink>
        <NavLink to="/customers" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <Users size={20} /> Customers
        </NavLink>
        <NavLink to="/pos" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <ShoppingCart size={20} /> POS & Cart
        </NavLink>
        <NavLink to="/reports" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <BarChart3 size={20} /> Daily Reports
        </NavLink>
      </nav>
      <div className="sidebar-footer">
        <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
      </div>
    </aside>
  );
}

function App() {
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

  return (
    <HashRouter>
      <div className="app-container">
        <Sidebar theme={theme} toggleTheme={toggleTheme} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
        {/* Floating theme toggle for mobile */}
        <button
          className="mobile-theme-fab"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>
    </HashRouter>
  );
}

export default App;
