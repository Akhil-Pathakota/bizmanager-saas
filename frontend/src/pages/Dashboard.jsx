import React, { useEffect, useState } from 'react';
import { DollarSign, PackageOpen, TrendingUp, Users, AlertTriangle, UserPlus, Copy, Check, Shield, UserCheck } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const { isOwner } = useAuth();
  const [data, setData] = useState(null);
  const [team, setTeam] = useState([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error);
    api.get('/users').then(res => setTeam(res.data)).catch(console.error);
  }, []);

  const handleFactoryReset = () => {
    if (window.confirm("WARNING! Are you absolutely sure you want to delete ALL data permanently? This action cannot be undone.")) {
      const confirmWord = window.prompt("Type 'RESET' to confirm formatting the entire database:");
      if (confirmWord === 'RESET') {
        api.post('/factory-reset').then(() => {
          alert('Database reset successful. App is now completely fresh.');
          window.location.reload();
        }).catch(err => alert("Failed to reset: " + (err.response?.data?.error || err.message)));
      } else {
        alert("Reset cancelled. You did not type RESET.");
      }
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteLoading(true);
    try {
      const res = await api.post('/auth/invite', { email: inviteEmail || null });
      setInviteCode(res.data.code);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create invite');
    } finally {
      setInviteLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return <div className="page-header"><h1 className="page-title">Loading...</h1></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard Overview</h1>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => { setShowInviteModal(true); setInviteCode(''); setInviteEmail(''); }}>
            <UserPlus size={16}/> Invite Employee
          </button>
          <button className="btn btn-danger" onClick={handleFactoryReset}>
            <AlertTriangle size={16}/> Factory Reset
          </button>
        </div>
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
          <p className="mt-4">You have <strong>{data.lowStockCount}</strong> items running low in stock (5 or less remaining).</p>
        </div>
      )}

      {/* Team Section */}
      <div className="card mt-4">
        <h3 className="flex items-center gap-2 mb-4"><Users size={18}/> Your Team</h3>
        <div className="table-container" style={{boxShadow: 'none', border: '1px solid var(--border-light)'}}>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {team.map(u => (
                <tr key={u.id}>
                  <td style={{fontWeight: 600}}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`sidebar-role-badge ${u.role === 'owner' ? 'role-owner' : 'role-employee'}`}>
                      {u.role === 'owner' ? <><Shield size={11}/> Owner</> : <><UserCheck size={11}/> Employee</>}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-4">Invite Employee</h2>
            {!inviteCode ? (
              <form onSubmit={handleInvite}>
                <div className="form-group">
                  <label className="form-label">Employee Email (Optional)</label>
                  <input className="form-input" type="email" value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder="employee@example.com" />
                  <small className="text-secondary" style={{display: 'block', marginTop: '4px'}}>
                    Leave blank to create a code anyone can use.
                  </small>
                </div>
                <div className="flex justify-between mt-4">
                  <button type="button" className="btn btn-outline" onClick={() => setShowInviteModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" disabled={inviteLoading}>
                    {inviteLoading ? 'Generating...' : 'Generate Invite Code'}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <p className="text-secondary mb-4">Share this code with your employee. They'll use it to register.</p>
                <div className="invite-code-display">
                  <span className="invite-code-text">{inviteCode}</span>
                  <button className="btn btn-outline" onClick={copyCode} style={{padding: '8px 12px'}}>
                    {copied ? <><Check size={16}/> Copied!</> : <><Copy size={16}/> Copy</>}
                  </button>
                </div>
                <div className="flex justify-between mt-4">
                  <button className="btn btn-outline" onClick={() => setShowInviteModal(false)}>Done</button>
                  <button className="btn btn-primary" onClick={() => { setInviteCode(''); setInviteEmail(''); }}>
                    Generate Another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
