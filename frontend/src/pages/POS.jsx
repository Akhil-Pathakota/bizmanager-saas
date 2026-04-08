import React, { useState, useEffect } from 'react';
import { ShoppingCart, Trash2 } from 'lucide-react';
import api from '../api';

// Units that allow decimal quantities
const DECIMAL_UNITS = ['kg', 'g', 'mg', 'lb', 'oz', 'ton', 'quintal', 'ft', 'in', 'm', 'cm', 'mm', 'yd', 'km', 'L', 'mL', 'gal', 'qt', 'sqft', 'sqm'];

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amountPaidUpfront, setAmountPaidUpfront] = useState('');

  useEffect(() => {
    api.get('/products').then(res => setProducts(res.data)).catch(console.error);
    api.get('/customers').then(res => setCustomers(res.data)).catch(console.error);
  }, []);

  const addToCart = (product) => {
    const isDecimal = DECIMAL_UNITS.includes(product.unit || 'pcs');
    const incrementAmount = isDecimal ? 1 : 1;
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.currentStock) return alert('Not enough stock');
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + incrementAmount } : c));
    } else {
      if (product.currentStock <= 0) return alert('Out of stock');
      setCart([...cart, {
        productId: product.id,
        name: product.name,
        quantity: 1,
        actualSellingPrice: product.defaultSellingPrice,
        maxStock: product.currentStock,
        unit: product.unit || 'pcs'
      }]);
    }
  };

  const updateCartItem = (productId, field, value) => {
    setCart(cart.map(c => {
      if (c.productId === productId) {
        if (field === 'quantity' && value > c.maxStock) {
          alert('Cannot exceed stock');
          return c;
        }
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  const removeFromCart = (productId) => setCart(cart.filter(c => c.productId !== productId));

  const totalValue = cart.reduce((acc, c) => acc + (c.quantity * (parseFloat(c.actualSellingPrice) || 0)), 0);
  const balanceAdded = Math.max(0, totalValue - (amountPaidUpfront === '' ? 0 : parseFloat(amountPaidUpfront)));

  const handleCheckout = () => {
    if (cart.length === 0) return alert('Cart is empty');

    // Validate guest checkout
    if (!selectedCustomerId && balanceAdded > 0) {
      return alert('Guest checkout cannot have an outstanding balance. Full payment is required or select a customer to charge credit.');
    }

    const actualPaid = amountPaidUpfront === '' ? totalValue : parseFloat(amountPaidUpfront);
    const actualBalance = Math.max(0, totalValue - actualPaid);

    const payload = {
      customerId: selectedCustomerId ? parseInt(selectedCustomerId) : null,
      amountPaidUpfront: actualPaid,
      items: cart.map(c => ({
        productId: c.productId,
        quantity: c.quantity,
        actualSellingPrice: parseFloat(c.actualSellingPrice)
      }))
    };

    api.post('/orders', payload).then((res) => {
      // Send WhatsApp thank-you message if customer is selected
      if (selectedCustomerId) {
        const customer = customers.find(c => c.id === parseInt(selectedCustomerId));
        if (customer && customer.phone) {
          let phone = (customer.phone || '').replace(/[\s\-\(\)\+]/g, '');
          if (phone.length === 10) phone = '91' + phone;

          const newTotalBalance = (Number(customer.totalOutstandingBalance) + actualBalance).toFixed(2);
          let message = '';

          if (actualBalance > 0) {
            // Partial payment — friendly reminder about pending amount
            message = `Hi ${customer.name}, thank you so much for your purchase today! Your total was ₹${totalValue.toFixed(2)} and we received ₹${actualPaid.toFixed(2)}. There's a pending balance of ₹${actualBalance.toFixed(2)} from this bill. Your overall outstanding amount is ₹${newTotalBalance}. Whenever it's convenient for you, please clear the balance. Thanks again and see you soon!`;
          } else {
            // Fully paid
            if (Number(customer.totalOutstandingBalance) > 0) {
              // Paid this bill fully but has old pending balance
              message = `Hi ${customer.name}, thanks for shopping with us today! Your bill of ₹${totalValue.toFixed(2)} has been fully paid. Just a gentle reminder — you still have a previous balance of ₹${Number(customer.totalOutstandingBalance).toFixed(2)} pending. No rush, just whenever you can. Thanks and have a great day!`;
            } else {
              // All clear — no pending at all
              message = `Hi ${customer.name}, thank you for your purchase today! Your bill of ₹${totalValue.toFixed(2)} has been fully paid. We really appreciate your business — hope to see you again soon! Have a great day!`;
            }
          }

          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          window.open(whatsappUrl, '_blank');
        }
      }

      alert(`Sale completed successfully! Order ID: ${res.data.orderId}`);
      setCart([]);
      setSelectedCustomerId('');
      setAmountPaidUpfront('');

      // Refresh products stock
      api.get('/products').then(r => setProducts(r.data));
    }).catch(err => alert(err.response?.data?.error || 'Failed to checkout'));
  };

  return (
    <div className="pos-layout">
      {/* Product List */}
      <div className="pos-products">
        <div className="page-header">
          <h1 className="page-title">Point of Sale & Cart</h1>
        </div>
        <div className="pos-product-grid">
          {products.map(p => (
            <div key={p.id} className="card pos-product-card">
              <div>
                <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{p.name}</h3>
                <p className="text-secondary" style={{ fontSize: '12px' }}>{p.category}</p>
              </div>
              <div className="flex justify-between items-center">
                <span style={{ fontWeight: 600 }}>₹{Number(p.defaultSellingPrice).toFixed(2)}</span>
                <span className={`badge ${p.currentStock > 0 ? 'badge-success' : 'badge-danger'}`}>{p.currentStock} {p.unit || 'pcs'}</span>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 'auto' }}
                onClick={() => addToCart(p)}
                disabled={p.currentStock === 0}
              >
                <ShoppingCart size={14} /> Add to cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cart Logic */}
      <div className="card pos-cart">
        <h2 style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>Current Order</h2>

        <div className="form-group">
          <label className="form-label">Select Customer (Optional)</label>
          <select className="form-input" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
            <option value="">Guest Walk-in (No Credit)</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
          </select>
        </div>

        <div className="pos-cart-items">
          {cart.length === 0 && <p className="text-secondary text-center" style={{ padding: '24px 0' }}>Cart is empty. Select products above.</p>}
          {cart.map(item => {
            const isDecimal = DECIMAL_UNITS.includes(item.unit || 'pcs');
            return (
              <div key={item.productId} className="pos-cart-item">
                <div className="flex justify-between items-center mb-2">
                  <strong>{item.name}</strong>
                  <button onClick={() => removeFromCart(item.productId)} style={{ background: 'none', border: 'none', color: 'var(--brand-danger)', cursor: 'pointer', padding: '8px' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex gap-4">
                  <div style={{ flex: 1 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Qty ({item.unit})</label>
                    <input type="number" className="form-input" step={isDecimal ? '0.01' : '1'} min={isDecimal ? '0.01' : '1'} max={item.maxStock} value={item.quantity} onChange={(e) => updateCartItem(item.productId, 'quantity', parseFloat(e.target.value) || (isDecimal ? 0.01 : 1))} />
                  </div>
                  <div style={{ flex: 2 }}>
                    <label className="form-label" style={{ fontSize: '12px' }}>Custom Price (₹)</label>
                    <input type="number" step="0.01" className="form-input" value={item.actualSellingPrice} onChange={(e) => updateCartItem(item.productId, 'actualSellingPrice', e.target.value)} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="pos-cart-footer">
          <div className="flex justify-between mb-4">
            <span style={{ fontSize: '18px', fontWeight: 600 }}>Total:</span>
            <span style={{ fontSize: '24px', fontWeight: 700 }}>₹{totalValue.toFixed(2)}</span>
          </div>

          <div className="form-group">
            <label className="form-label">Amount Paid Upfront (₹)</label>
            <input type="number" step="0.01" className="form-input" placeholder={`Optional, default ₹${totalValue.toFixed(2)}`} value={amountPaidUpfront} onChange={e => setAmountPaidUpfront(e.target.value)} />
            {balanceAdded > 0 && selectedCustomerId && (
              <small className="text-secondary" style={{ display: 'block', marginTop: '4px' }}>
                ₹{balanceAdded.toFixed(2)} will be added to customer credit balance.
              </small>
            )}
            {balanceAdded > 0 && !selectedCustomerId && (
              <small className="text-danger" style={{ display: 'block', marginTop: '4px' }}>
                Guest checkout cannot have balance. Full amount required.
              </small>
            )}
          </div>
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px' }}
            onClick={handleCheckout}
            disabled={cart.length === 0 || (!selectedCustomerId && balanceAdded > 0)}
          >
            Process Sale
          </button>
        </div>
      </div>
    </div>
  );
}
