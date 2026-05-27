import React, { useState, useEffect } from 'react';
import { PackagePlus, Search, Plus, Trash2, CheckCircle2, Truck, FileText } from 'lucide-react';
import api from '../api';

export default function ReceiveStock() {
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [receiveItems, setReceiveItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    api.get('/api/vendors').then(res => setVendors(res.data)).catch(console.error);
    api.get('/api/products').then(res => setProducts(res.data)).catch(console.error);
  }, []);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addItemToReceive = (product) => {
    const existing = receiveItems.find(item => item.productId === product.id);
    if (existing) {
      updateItem(product.id, 'quantity', existing.quantity + 1);
    } else {
      setReceiveItems([...receiveItems, { 
        productId: product.id, 
        name: product.name, 
        unit: product.unit || 'pcs',
        quantity: 1, 
        unitCost: product.purchaseCost || 0 
      }]);
    }
    setSearchQuery('');
  };

  const updateItem = (productId, field, value) => {
    setReceiveItems(receiveItems.map(item => 
      item.productId === productId ? { ...item, [field]: Number(value) } : item
    ));
  };

  const removeItem = (productId) => {
    setReceiveItems(receiveItems.filter(item => item.productId !== productId));
  };

  const totalOrderCost = receiveItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

  const handleSubmit = async () => {
    if (receiveItems.length === 0) return alert("Add items to finalize invoice.");
    setLoading(true);
    try {
      const payload = {
        vendorId: selectedVendor ? Number(selectedVendor) : null,
        invoiceNumber,
        notes,
        totalCost: totalOrderCost,
        items: receiveItems
      };
      await api.post('/api/purchases', payload);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedVendor('');
        setInvoiceNumber('');
        setNotes('');
        setReceiveItems([]);
        api.get('/api/products').then(res => setProducts(res.data));
      }, 2000);
    } catch (err) {
      alert(err.response?.data?.error || "Error processing delivery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 className="page-title" style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PackagePlus size={24} /> Receive Stock
        </h1>
        <p className="text-secondary" style={{ fontSize: '14px', marginTop: '4px' }}>Log incoming deliveries and instantly update your inventory.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* LEFT COLUMN: Delivery Details & Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          <div className="modal-content" style={{ width: '100%', position: 'static', margin: 0, padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Truck size={18}/> Shipment Invoice
            </h2>
            <div className="form-group">
              <label className="form-label">Vendor / Supplier</label>
              <select className="form-input" style={{ width: '100%' }} value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)}>
                <option value="">-- Dropdown Selection --</option>
                {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Bill / Invoice Number</label>
              <input className="form-input" type="text" placeholder="e.g. #9082" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
            </div>
          </div>

          <div className="modal-content" style={{ width: '100%', position: 'static', margin: 0, padding: '24px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '16px' }}>Search Catalog</h2>
            <div className="form-group">
              <input type="text" placeholder="Type items names..." className="form-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {searchQuery && filteredProducts.map(p => (
                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                  <div style={{ fontSize: '13px' }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    <div className="text-secondary">Stock: {p.currentStock} {p.unit}</div>
                  </div>
                  <button onClick={() => addItemToReceive(p)} className="btn btn-primary" style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Plus size={14}/>
                  </button>
                </div>
              ))}
              {searchQuery && filteredProducts.length === 0 && (
                <div className="text-secondary text-center" style={{ fontStyle: 'italic', padding: '12px' }}>No products found.</div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: The Receiving List Table */}
        <div className="table-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '500px', margin: 0 }}>
          
          <div style={{ padding: '16px 20px', fontWeight: 600, borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
            Items Unloaded From Delivery
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>Quantity</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>Cost Price (₹)</th>
                  <th style={{ textAlign: 'right' }}>Line Subtotal</th>
                  <th style={{ width: '60px', textAlign: 'center' }}></th>
                </tr>
              </thead>
              <tbody>
                {receiveItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-secondary" style={{ padding: '60px 20px', fontStyle: 'italic' }}>
                      Add active stock lines from the search portal to build the invoice.
                    </td>
                  </tr>
                )}
                {receiveItems.map(item => (
                  <tr key={item.productId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.name}</div>
                      <div style={{ fontSize: '11px' }} className="text-secondary">{item.unit}</div>
                    </td>
                    <td>
                      <input type="number" className="form-input" style={{ padding: '6px', textAlign: 'center', width: '100%' }} value={item.quantity} onChange={(e) => updateItem(item.productId, 'quantity', e.target.value)} />
                    </td>
                    <td>
                      <input type="number" className="form-input" style={{ padding: '6px', textAlign: 'center', width: '100%' }} value={item.unitCost} onChange={(e) => updateItem(item.productId, 'unitCost', e.target.value)} />
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>₹{(item.quantity * item.unitCost).toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button onClick={() => removeItem(item.productId)} className="btn btn-danger" style={{ padding: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Bottom Total & Submit Footer */}
          <div style={{ padding: '20px', borderTop: '1px solid var(--border-color, #e2e8f0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div className="text-secondary" style={{ fontSize: '13px' }}>Calculated Net Cost</div>
              <div style={{ fontSize: '24px', fontWeight: 700 }}>₹{totalOrderCost.toFixed(2)}</div>
            </div>
            <button 
              onClick={handleSubmit} 
              disabled={loading || receiveItems.length === 0} 
              className="btn btn-primary" 
              style={{ background: success ? '#22c55e' : '', padding: '12px 24px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', border: success ? 'none' : '' }}
            >
              {success ? <><CheckCircle2 size={18}/> Applied to Stock</> : loading ? 'Uploading...' : <><PackagePlus size={18}/> Commit Cargo</>}
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}