import React, { useEffect, useState } from 'react';
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, ShoppingCart } from 'lucide-react';
import api from '../api';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);

  const loadReports = (from, to) => {
    setLoading(true);
    let url = '/reports/daily';
    const params = [];
    if (from) params.push(`from=${from}`);
    if (to) params.push(`to=${to}`);
    if (params.length) url += '?' + params.join('&');
    api.get(url).then(res => setReports(res.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { loadReports(); }, []);

  const applyQuickFilter = (filter) => {
    setActiveFilter(filter);
    const today = new Date();
    let from = '', to = '';
    
    if (filter === 'today') {
      from = to = today.toISOString().split('T')[0];
    } else if (filter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(today.getDate() - 7);
      from = weekAgo.toISOString().split('T')[0];
      to = today.toISOString().split('T')[0];
    } else if (filter === 'month') {
      from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      to = today.toISOString().split('T')[0];
    } else if (filter === 'year') {
      from = `${today.getFullYear()}-01-01`;
      to = today.toISOString().split('T')[0];
    } else {
      from = '';
      to = '';
    }
    
    setDateFrom(from);
    setDateTo(to);
    loadReports(from, to);
  };

  const applyCustomRange = () => {
    setActiveFilter('custom');
    loadReports(dateFrom, dateTo);
  };

  const handleDownload = async (format) => {
    setShowDownloadMenu(false);
    try {
      const params = [];
      if (dateFrom) params.push(`from=${dateFrom}`);
      if (dateTo) params.push(`to=${dateTo}`);
      params.push(`format=${format}`);
      
      const response = await api.get(`/reports/export?${params.join('&')}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BizManager_Report_${dateFrom || 'all'}_to_${dateTo || 'all'}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download report: ' + (err.response?.data?.error || err.message));
    }
  };

  // Summary calculations
  const totalRevenue = reports.reduce((sum, r) => sum + r.revenue, 0);
  const totalProfit = reports.reduce((sum, r) => sum + r.profit, 0);
  const totalOrders = reports.reduce((sum, r) => sum + r.orderCount, 0);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Reports & Analytics</h1>
        <div className="report-download-wrapper">
          <button className="btn btn-primary" onClick={() => setShowDownloadMenu(!showDownloadMenu)}>
            <Download size={16} /> Download Report
          </button>
          {showDownloadMenu && (
            <div className="report-download-menu">
              <button onClick={() => handleDownload('csv')}>📄 Download as CSV</button>
              <button onClick={() => handleDownload('xlsx')}>📊 Download as Excel</button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Filters */}
      <div className="report-filters">
        <div className="report-quick-filters">
          {[
            { key: 'all', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'year', label: 'This Year' },
          ].map(f => (
            <button key={f.key}
              className={`pos-chip ${activeFilter === f.key ? 'pos-chip-active' : ''}`}
              onClick={() => applyQuickFilter(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="report-date-range">
          <div className="report-date-input">
            <Calendar size={14} />
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <span className="text-secondary">to</span>
          <div className="report-date-input">
            <Calendar size={14} />
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-outline" onClick={applyCustomRange} style={{padding: '8px 16px'}}>Apply</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="report-summary-grid">
        <div className="card report-summary-card">
          <div className="report-summary-icon" style={{background: '#dbeafe', color: '#2563eb'}}>
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-secondary" style={{fontSize: '13px'}}>Total Revenue</p>
            <h3 style={{fontSize: '22px'}}>₹{totalRevenue.toFixed(2)}</h3>
          </div>
        </div>
        <div className="card report-summary-card">
          <div className="report-summary-icon" style={{background: '#d1fae5', color: '#10b981'}}>
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-secondary" style={{fontSize: '13px'}}>Total Profit</p>
            <h3 style={{fontSize: '22px'}} className={totalProfit >= 0 ? 'text-success' : 'text-danger'}>
              {totalProfit >= 0 ? '+' : ''}₹{totalProfit.toFixed(2)}
            </h3>
          </div>
        </div>
        <div className="card report-summary-card">
          <div className="report-summary-icon" style={{background: '#fef3c7', color: '#d97706'}}>
            <ShoppingCart size={20} />
          </div>
          <div>
            <p className="text-secondary" style={{fontSize: '13px'}}>Total Orders</p>
            <h3 style={{fontSize: '22px'}}>{totalOrders}</h3>
          </div>
        </div>
      </div>

      {/* Daily Table */}
      <div className="card">
        <h3 className="flex items-center gap-2 mb-4"><BarChart3 size={18}/> Daily Breakdown</h3>
        <div className="table-container" style={{boxShadow: 'none', border: '1px solid var(--border-light)'}}>
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Orders</th>
                <th>Revenue</th>
                <th>Profit/Loss</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="text-secondary text-center" style={{padding: '24px'}}>Loading...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="4" className="text-secondary text-center" style={{padding: '24px'}}>No sales data for this period.</td></tr>
              ) : (
                <>
                  {reports.map(r => (
                    <tr key={r.date}>
                      <td style={{fontWeight: 600}}>{new Date(r.date).toLocaleDateString()}</td>
                      <td>{r.orderCount} Orders</td>
                      <td>₹{Number(r.revenue).toFixed(2)}</td>
                      <td className={r.profit >= 0 ? "text-success" : "text-danger"} style={{fontWeight: 600}}>
                        {r.profit >= 0 ? '+' : '-'}₹{Math.abs(r.profit).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {/* Summary Row */}
                  <tr className="report-summary-row">
                    <td style={{fontWeight: 700}}>TOTAL</td>
                    <td style={{fontWeight: 600}}>{totalOrders} Orders</td>
                    <td style={{fontWeight: 700}}>₹{totalRevenue.toFixed(2)}</td>
                    <td style={{fontWeight: 700}} className={totalProfit >= 0 ? "text-success" : "text-danger"}>
                      {totalProfit >= 0 ? '+' : '-'}₹{Math.abs(totalProfit).toFixed(2)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
