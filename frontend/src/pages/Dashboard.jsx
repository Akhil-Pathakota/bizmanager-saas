import React, { useEffect, useState } from 'react';
import { DollarSign, PackageOpen, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import api from '../api';

export default function Dashboard() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error);
  }, []);

  const handleFactoryReset = () => {
    if (window.confirm("WARNING! Are you absolutely sure you want to delete ALL data permanently? This action cannot be undone.")) {
      const confirmWord = window.prompt("Type 'RESET' to confirm formatting the entire database:");
      if (confirmWord === 'RESET') {
        api.post('/factory-reset').then(() => {
          alert('Database reset successful. App is now completely fresh.');
          window.location.reload();
        }).catch(err => alert("Failed to reset: " + err.response?.data?.error));
      } else {
        alert("Reset cancelled. You did not type RESET.");
      }
    }
  };

  if (!data) return <div className="page-header"><h1 className="page-title">Loading...</h1></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <button className="btn btn-danger" onClick={handleFactoryReset}>
          <AlertTriangle size={16}/> Factory Reset App
        </button>
      </div>
      
      <div className="dashboard-stats-grid">
        <div className="card">
          <div className="flex items-center gap-4">
            <div style={{background: '#dbeafe', color: '#2563eb', padding: '12px', borderRadius: '12px'}}>
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-secondary" style={{fontSize: '14px', fontWeight: 600}}>Total Revenue</p>
              <h2 style={{fontSize: '24px', letterSpacing: '-0.5px'}}>₹{data.totalRevenue.toFixed(2)}</h2>
              <span className="badge badge-success mt-2" style={{fontSize: '11px'}}>Today: ₹{data.todayRevenue?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div style={{background: '#d1fae5', color: '#10b981', padding: '12px', borderRadius: '12px'}}>
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-secondary" style={{fontSize: '14px', fontWeight: 600}}>Net Profit</p>
              <h2 style={{fontSize: '24px', letterSpacing: '-0.5px'}} className="text-success">+ ₹{data.totalProfit.toFixed(2)}</h2>
              <span className="badge badge-success mt-2" style={{fontSize: '11px'}}>Today: ₹{data.todayProfit?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div style={{background: '#fef3c7', color: '#d97706', padding: '12px', borderRadius: '12px'}}>
              <PackageOpen size={24} />
            </div>
            <div>
              <p className="text-secondary" style={{fontSize: '14px', fontWeight: 600}}>Total Investment</p>
              <h2 style={{fontSize: '24px', letterSpacing: '-0.5px'}}>₹{data.totalInvestment.toFixed(2)}</h2>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center gap-4">
            <div style={{background: '#fee2e2', color: '#ef4444', padding: '12px', borderRadius: '12px'}}>
              <Users size={24} />
            </div>
            <div>
              <p className="text-secondary" style={{fontSize: '14px', fontWeight: 600}}>Pending Credits</p>
              <h2 style={{fontSize: '24px', letterSpacing: '-0.5px'}} className="text-danger">₹{data.totalOutstandingCredit.toFixed(2)}</h2>
            </div>
          </div>
        </div>
      </div>
      
      {data.lowStockCount > 0 && (
        <div className="card" style={{borderLeft: '4px solid var(--brand-warning)'}}>
          <h3 style={{color: 'var(--brand-warning)', display: 'flex', alignItems: 'center', gap: '8px'}}>
            <PackageOpen size={20} /> Watch out!
          </h3>
          <p className="mt-4">You have <strong>{data.lowStockCount}</strong> items that are running low in stock (5 or less remaining). Check the inventory to reorder before you run out.</p>
        </div>
      )}
    </div>
  );
}
