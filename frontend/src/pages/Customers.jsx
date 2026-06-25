import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, ChevronDown, ChevronRight, History, MessageCircle } from 'lucide-react';
import api from '../api';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [activeCustomer, setActiveCustomer] = useState(null);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [customerOrders, setCustomerOrders] = useState({});
  
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [payForm, setPayForm] = useState({ amount: 0, notes: '' });

  const loadCustomers = () => {
    api.get('/api/customers').then(res => setCustomers(res.data)).catch(console.error);
  };

  useEffect(() => { loadCustomers(); }, []);

  const toggleExpand = (customerId) => {
    if (expandedCustomerId === customerId) {
      setExpandedCustomerId(null);
    } else {
      setExpandedCustomerId(customerId);
      if (!customerOrders[customerId]) {
        api.get(`/api/customers/${customerId}/orders`).then(res => {
          setCustomerOrders(prev => ({ ...prev, [customerId]: res.data }));
        }).catch(console.error);
      }
    }
  };

  const handleCreateCustomer = (e) => {
    e.preventDefault();
    api.post('/api/customers', form).then(() => {
      loadCustomers();
      setShowAddModal(false);
      setForm({ name: '', phone: '', address: '' });
    }).catch(console.error);
  };

  const handlePayment = (e) => {
    e.preventDefault();
    api.post(`/api/customers/${activeCustomer.id}/payment`, payForm).then(() => {
      loadCustomers();
      setShowPayModal(false);
      setActiveCustomer(null);
      setPayForm({ amount: 0, notes: '' });
    }).catch(console.error);
  };

  const sendWhatsAppReminder = (customer) => {
    let phone = (customer.phone || '').replace(/[\s\-\(\)\+]/g, '');
    if (!phone || phone.length < 10) {
      alert(`Cannot send WhatsApp reminder: ${customer.name} does not have a valid phone number.`);
      return;
    }
    if (phone.length === 10) phone = '91' + phone;
    
    const amount = Number(customer.totalOutstandingBalance).toFixed(2);
    const message = `Hello ${customer.name},\n\nThis is a friendly reminder from BizManager.\n\nYou have a pending balance of ₹${amount}.\n\nPlease make payment at your earliest convenience.\n\nThank you!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers & Credits</h1>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}><Plus size={16}/> Add Customer</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Contact Details</th>
              <th>Pending Balance</th>
              <th className="text-right">Actions</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
             {customers.length === 0 && (
              <tr><td colSpan="6" className="text-center text-secondary">No customers added yet.</td></tr>
            )}
            {customers.map(c => (
              <React.Fragment key={c.id}>
                <tr style={{cursor: 'pointer'}} onClick={() => toggleExpand(c.id)}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      {expandedCustomerId === c.id ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                      {c.id}
                    </div>
                  </td>
                  <td style={{fontWeight: 600}}>{c.name}</td>
                  <td>
                    <div>{c.phone}</div>
                    {c.address && <div className="text-secondary" style={{fontSize: '12px', marginTop: '4px'}}>{c.address}</div>}
                  </td>
                  <td>
                    <span className={`badge ${c.totalOutstandingBalance > 0 ? 'badge-danger' : 'badge-success'}`}>
                      ₹{Number(c.totalOutstandingBalance).toFixed(2)}
                    </span>
                  </td>
                  <td className="text-right">
                    <div style={{display: 'flex', gap: '6px', justifyContent: 'flex-end', flexWrap: 'wrap'}}>
                      {c.totalOutstandingBalance > 0 && (
                        <>
                          <button className="btn btn-whatsapp" style={{padding: '6px 12px'}} 
                            onClick={(e) => { e.stopPropagation(); sendWhatsAppReminder(c); }}
                            title="Send WhatsApp Reminder">
                            <MessageCircle size={14}/> <span className="btn-label-desktop">Remind</span>
                          </button>
                          <button className="btn btn-outline" style={{padding: '6px 12px'}} 
                            onClick={(e) => { e.stopPropagation(); setActiveCustomer(c); setPayForm({ amount: c.totalOutstandingBalance, notes: 'Cleared balance' }); setShowPayModal(true); }}>
                            <CheckCircle size={14}/> <span className="btn-label-desktop">Payment</span>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                  
                  <td>
                     {c.phone ? (
                      <a 
                      href={`tel:${c.phone}`} 
                      className="btn btn-outline"
                      style={{padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px'}}
                      onClick={(e) => e.stopPropagation()}>
                        📞 Call
                      </a>
                      ) : (
                      <span className="text-secondary text-sm">No Number</span>
                      )}
                  </td>
                </tr>
                {expandedCustomerId === c.id && (
                  <tr>
                    <td colSpan="6" style={{backgroundColor: 'var(--bg-expanded-row)', padding: '20px 32px'}}>
                      <div className="card" style={{margin: 0, boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)'}}>
                        <h3 className="flex items-center gap-2 mb-4" style={{fontSize: '15px'}}><History size={16}/> Order History</h3>
                        {!customerOrders[c.id] ? <p className="text-secondary text-sm">Loading orders...</p> : 
                          customerOrders[c.id].length === 0 ? <p className="text-secondary text-sm">No previous orders found.</p> : (
                            <table className="table" style={{backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-light)'}}>
                              <thead>
                                <tr>
                                  <th style={{padding: '12px 16px'}}>Date</th>
                                  <th style={{padding: '12px 16px'}}>Items</th>
                                  <th style={{padding: '12px 16px'}}>Total Price</th>
                                  <th style={{padding: '12px 16px'}}>Paid Upfront</th>
                                  <th style={{padding: '12px 16px'}}>Added Credit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {customerOrders[c.id].map(order => (
                                  <tr key={order.id}>
                                    <td style={{padding: '12px 16px'}}>{new Date(order.date).toLocaleDateString()}</td>
                                    <td style={{padding: '12px 16px'}}>
                                      <ul style={{margin: 0, paddingLeft: '16px'}}>
                                        {order.items.map((item, i) => (
                                          <li key={i} style={{fontSize: '13px'}}>{item.quantity}x {item.productName}</li>
                                        ))}
                                      </ul>
                                    </td>
                                    <td style={{fontWeight: 600, padding: '12px 16px'}}>₹{order.totalValue.toFixed(2)}</td>
                                    <td style={{padding: '12px 16px'}}>₹{order.paidUpfront.toFixed(2)}</td>
                                    <td className={order.balanceAdded > 0 ? "text-danger" : "text-success"} style={{padding: '12px 16px'}}>
                                      ₹{order.balanceAdded.toFixed(2)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )
                        }
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-4">Add New Customer</h2>
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input required className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="e.g. 9876543210" />
                <small className="text-secondary" style={{display: 'block', marginTop: '4px'}}>
                  Enter 10-digit number. Country code (91) is added automatically for WhatsApp.
                </small>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea className="form-input" rows="2" value={form.address || ''} onChange={e => setForm({...form, address: e.target.value})} />
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPayModal && activeCustomer && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-4">Receive Payment</h2>
            <p className="mb-4 text-secondary">Paying balance for <strong>{activeCustomer.name}</strong></p>
            <form onSubmit={handlePayment}>
              <div className="form-group">
                <label className="form-label">Amount Received (₹)</label>
                <input required className="form-input" type="number" step="0.01" value={payForm.amount} onChange={e => setPayForm({...payForm, amount: e.target.value})} />
                <small className="text-secondary mt-2" style={{display:'block'}}>Current Balance: ₹{Number(activeCustomer.totalOutstandingBalance).toFixed(2)}</small>
              </div>
              <div className="form-group">
                <label className="form-label">Notes / Description</label>
                <input className="form-input" value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} />
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={() => setShowPayModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Process Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
