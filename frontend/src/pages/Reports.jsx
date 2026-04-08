import React, { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import api from '../api';

export default function Reports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get('/reports/daily').then(res => setReports(res.data)).catch(console.error);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Daily Reports</h1>
      </div>

      <div className="card">
        <h3 className="flex items-center gap-2 mb-4"><BarChart3 size={18}/> Daily Profits and Losses</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Orders Count</th>
              <th>Total Revenue</th>
              <th>Net Profit/Loss</th>
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr><td colSpan="4" className="text-secondary text-center" style={{padding: '24px'}}>No sales data available yet.</td></tr>
            ) : reports.map(r => (
              <tr key={r.date}>
                <td style={{fontWeight: 600}}>{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.orderCount} Orders</td>
                <td>₹{Number(r.revenue).toFixed(2)}</td>
                <td className={r.profit >= 0 ? "text-success" : "text-danger"} style={{fontWeight: 600}}>
                  {r.profit >= 0 ? '+' : '-'}₹{Math.abs(r.profit).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
