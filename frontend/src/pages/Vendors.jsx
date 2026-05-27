import React, { useEffect, useState } from 'react';
import { Truck, Plus, Trash2, Phone, Mail, ChevronDown, ChevronUp, Package, Receipt } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Vendors() {
  const { isOwner } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', contactPhone: '', contactEmail: '', leadTimeDays: 3 });
  
  const [expandedVendorId, setExpandedVendorId] = useState(null);
  const [historyData, setHistoryData] = useState({});
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadVendors = () => {
    api.get('/api/vendors').then(res => setVendors(res.data)).catch(console.error);
  };

  useEffect(() => { loadVendors(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    api.post('/api/vendors', formData).then(() => {
      loadVendors();
      setShowModal(false);
      setFormData({ name: '', contactPhone: '', contactEmail: '', leadTimeDays: 3 });
    }).catch(console.error);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation(); 
    if(window.confirm('Are you sure you want to delete this supplier?')) {
      api.delete(`/api/vendors/${id}`)
        .then(() => {
          loadVendors();
          if (expandedVendorId === id) setExpandedVendorId(null);
        })
        .catch(err => alert(err.response?.data?.error || 'Failed to delete vendor.'));
    }
  };

  const toggleVendor = async (vendorId) => {
    if (expandedVendorId === vendorId) {
      setExpandedVendorId(null);
      return;
    }
    
    setExpandedVendorId(vendorId);
    
    if (!historyData[vendorId]) {
      setLoadingHistory(true);
      try {
        const res = await api.get(`/api/vendors/${vendorId}/api/purchases`);
        setHistoryData(prev => ({ ...prev, [vendorId]: res.data }));
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        setLoadingHistory(false);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Truck size={24} /> Supplier Management
          </h1>
          <p className="text-secondary" style={{ fontSize: '14px', marginTop: '4px' }}>Track vendors and click their row to view purchase histories.</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowModal(true)}>
          <Plus size={16}/> Add Supplier
        </button>
      </div>

      <div className="table-container">
        <table className="table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>Supplier Name</th>
              <th>Contact Info</th>
              <th>Est. Delivery Time</th>
              {isOwner && <th style={{ textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {vendors.length === 0 && (
              <tr><td colSpan={4} className="text-center text-secondary" style={{ padding: '24px' }}>No suppliers added yet.</td></tr>
            )}
            
            {vendors.map(v => (
              <React.Fragment key={v.id}>
                <tr onClick={() => toggleVendor(v.id)} style={{ cursor: 'pointer' }}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {expandedVendorId === v.id ? <ChevronUp size={18} className="text-primary"/> : <ChevronDown size={18} className="text-secondary"/>}
                      {v.name}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '13px' }} className="text-secondary">
                      {v.contactPhone && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={12}/> {v.contactPhone}</span>}
                      {v.contactEmail && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={12}/> {v.contactEmail}</span>}
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-success" style={{ padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>
                      {v.leadTimeDays} Days
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    {isOwner && (
                      <button 
                        className="btn btn-danger"
                        style={{ padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={(e) => handleDelete(v.id, e)}
                      >
                        <Trash2 size={16}/>
                      </button>
                    )}
                  </td>
                </tr>

                {/* --- THE DETAILED HISTORY ACCORDION --- */}
                {expandedVendorId === v.id && (
                  <tr>
                    <td colSpan="4" style={{ padding: '0' }}>
                      <div style={{ padding: '24px', borderLeft: '4px solid #3b82f6' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Receipt size={18} /> Order Log
                        </h3>
                        
                        {loadingHistory && !historyData[v.id] ? (
                          <div className="text-secondary">Loading logs...</div>
                        ) : !historyData[v.id] || historyData[v.id].length === 0 ? (
                          <div className="text-secondary" style={{ fontStyle: 'italic' }}>No entries linked to this supplier.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {historyData[v.id].map(purchase => (
                              <div key={purchase.id} className="modal-content" style={{ position: 'relative', width: '100%', margin: 0, padding: '20px' }}>
                                
                                {/* Date and Total Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                  <div style={{ fontWeight: 600, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    {formatDate(purchase.date)}
                                    {purchase.invoiceNumber && <span className="badge" style={{ fontSize: '12px' }}>Bill: {purchase.invoiceNumber}</span>}
                                  </div>
                                  <div style={{ textAlign: 'right' }}>
                                    <div className="text-secondary" style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Cost</div>
                                    <div style={{ fontWeight: 700, fontSize: '18px' }}>₹{Number(purchase.totalCost).toFixed(2)}</div>
                                  </div>
                                </div>

                                {/* Detailed Items Table */}
                                <table className="table" style={{ width: '100%', fontSize: '13px', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '0' }}>
                                  <thead>
                                    <tr>
                                      <th>Product</th>
                                      <th style={{ textAlign: 'center' }}>Qty</th>
                                      <th style={{ textAlign: 'right' }}>Unit Cost</th>
                                      <th style={{ textAlign: 'right' }}>Line Total</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {purchase.items.map((item, idx) => (
                                      <tr key={idx}>
                                        <td style={{ fontWeight: 500 }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Package size={14} className="text-primary"/>
                                            {item.productName}
                                          </div>
                                        </td>
                                        <td style={{ textAlign: 'center' }} className="text-secondary">
                                          {item.quantity}
                                        </td>
                                        <td style={{ textAlign: 'right' }} className="text-secondary">
                                          ₹{Number(item.unitCost).toFixed(2)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                                          ₹{(item.quantity * item.unitCost).toFixed(2)}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>

                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- ADD SUPPLIER MODAL --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Add New Supplier</h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input required className="form-input" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={formData.contactEmail} onChange={e => setFormData({...formData, contactEmail: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Estimated Delivery Time (Days)</label>
                <input required className="form-input" type="number" min="1" value={formData.leadTimeDays} onChange={e => setFormData({...formData, leadTimeDays: e.target.value})} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}