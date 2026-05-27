import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingCart, Trash2, Search, X, Plus, Minus, CheckCircle, Package } from 'lucide-react';
import api from '../api';

const DECIMAL_UNITS = ['kg', 'g', 'mg', 'lb', 'oz', 'ton', 'quintal', 'ft', 'in', 'm', 'cm', 'mm', 'yd', 'km', 'L', 'mL', 'gal', 'qt', 'sqft', 'sqm'];

export default function POS() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [amountPaidUpfront, setAmountPaidUpfront] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showReceipt, setShowReceipt] = useState(null);

  useEffect(() => {
    api.get('/api/products').then(res => setProducts(res.data)).catch(console.error);
    api.get('/api/customers').then(res => setCustomers(res.data)).catch(console.error);
  }, []);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
    return cats;
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  // Filter customers for searchable dropdown
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone && c.phone.includes(customerSearch))
    );
  }, [customers, customerSearch]);

  const addToCart = (product) => {
    if (product.currentStock <= 0) return;
    const existing = cart.find(c => c.productId === product.id);
    if (existing) {
      if (existing.quantity >= product.currentStock) return;
      setCart(cart.map(c => c.productId === product.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      setCart([...cart, {
        productId: product.id, name: product.name, quantity: 1,
        actualSellingPrice: product.defaultSellingPrice,
        maxStock: product.currentStock, unit: product.unit || 'pcs'
      }]);
    }
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(c => {
      if (c.productId === productId) {
        const newQty = c.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > c.maxStock) return c;
        return { ...c, quantity: newQty };
      }
      return c;
    }).filter(Boolean));
  };

  const updateCartItem = (productId, field, value) => {
    setCart(cart.map(c => {
      if (c.productId === productId) {
        if (field === 'quantity' && value > c.maxStock) return c;
        if (field === 'quantity' && value <= 0) return c;
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  const removeFromCart = (productId) => setCart(cart.filter(c => c.productId !== productId));

  const totalValue = cart.reduce((acc, c) => acc + (c.quantity * (parseFloat(c.actualSellingPrice) || 0)), 0);
  const balanceAdded = Math.max(0, totalValue - (amountPaidUpfront === '' ? 0 : parseFloat(amountPaidUpfront)));
  const cartItemCount = cart.reduce((acc, c) => acc + c.quantity, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (!selectedCustomerId && balanceAdded > 0) {
      return alert('Guest checkout cannot have an outstanding balance. Full payment is required or select a customer.');
    }

    const actualPaid = amountPaidUpfront === '' ? totalValue : parseFloat(amountPaidUpfront);
    const payload = {
      customerId: selectedCustomerId ? parseInt(selectedCustomerId) : null,
      amountPaidUpfront: actualPaid,
      items: cart.map(c => ({
        productId: c.productId, quantity: c.quantity,
        actualSellingPrice: parseFloat(c.actualSellingPrice)
      }))
    };

    api.post('/api/orders', payload).then((res) => {
      const customer = selectedCustomerId ? customers.find(c => c.id === parseInt(selectedCustomerId)) : null;
      const actualBalance = Math.max(0, totalValue - actualPaid);

      // Show receipt
      setShowReceipt({
        orderId: res.data.orderId,
        items: [...cart],
        total: totalValue,
        paid: actualPaid,
        balance: actualBalance,
        customer: customer,
      });

      // Send WhatsApp if customer with phone
      if (customer && customer.phone) {
        let phone = (customer.phone || '').replace(/[\s\-\(\)\+]/g, '');
        if (phone.length === 10) phone = '91' + phone;
        let message = '';
        if (actualBalance > 0) {
          const newTotalBalance = (Number(customer.totalOutstandingBalance) + actualBalance).toFixed(2);
          message = `Hi ${customer.name}, thank you for your purchase! Total: ₹${totalValue.toFixed(2)}, Paid: ₹${actualPaid.toFixed(2)}. Pending: ₹${actualBalance.toFixed(2)}. Outstanding: ₹${newTotalBalance}. Thanks!`;
        } else {
          message = `Hi ${customer.name}, thank you for your purchase! Bill of ₹${totalValue.toFixed(2)} fully paid. Have a great day!`;
        }
        window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      }

      setCart([]);
      setSelectedCustomerId('');
      setAmountPaidUpfront('');
      api.get('/api/products').then(r => setProducts(r.data));
    }).catch(err => alert(err.response?.data?.error || 'Failed to checkout'));
  };

  const closeReceipt = () => setShowReceipt(null);

  return (
    <div className="pos-layout">
      {/* Product Selection Panel */}
      <div className="pos-products">
        <div className="page-header">
          <h1 className="page-title">Point of Sale</h1>
        </div>

        {/* Search Bar */}
        <div className="pos-search-bar">
          <Search size={18} className="pos-search-icon" />
          <input
            type="text" placeholder="Search products..."
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="pos-search-input"
          />
          {searchQuery && (
            <button className="pos-search-clear" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="pos-category-chips">
          {categories.map(cat => (
            <button key={cat}
              className={`pos-chip ${activeCategory === cat ? 'pos-chip-active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="pos-product-grid">
          {filteredProducts.length === 0 && (
            <div className="pos-empty-state">
              <Package size={40} />
              <p>No products found</p>
            </div>
          )}
          {filteredProducts.map(p => {
            const inCart = cart.find(c => c.productId === p.id);
            return (
              <div key={p.id} className={`card pos-product-card ${p.currentStock <= 0 ? 'pos-out-of-stock' : ''}`}>
                <div>
                  <h3 style={{ fontSize: '15px', marginBottom: '4px', fontWeight: 600 }}>{p.name}</h3>
                  <p className="text-secondary" style={{ fontSize: '12px' }}>{p.category}</p>
                </div>
                <div className="flex justify-between items-center">
                  <span style={{ fontWeight: 700, fontSize: '16px' }}>₹{Number(p.defaultSellingPrice).toFixed(2)}</span>
                  <span className={`badge ${p.currentStock > 5 ? 'badge-success' : p.currentStock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                    {p.currentStock} {p.unit || 'pcs'}
                  </span>
                </div>
                <button
                  className={`btn ${inCart ? 'btn-outline' : 'btn-primary'} pos-add-btn`}
                  onClick={() => addToCart(p)}
                  disabled={p.currentStock <= 0}
                >
                  {p.currentStock <= 0 ? 'Out of Stock' : inCart ? `In Cart (${inCart.quantity})` : <><Plus size={14}/> Add</>}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="card pos-cart">
        <div className="pos-cart-header">
          <h2>
            <ShoppingCart size={20} /> Cart
            {cartItemCount > 0 && <span className="pos-cart-badge">{cartItemCount}</span>}
          </h2>
        </div>

        {/* Customer Selection */}
        <div className="form-group">
          <label className="form-label">Customer</label>
          <input
            type="text" className="form-input" placeholder="Search customer or leave for walk-in..."
            value={customerSearch}
            onChange={e => { setCustomerSearch(e.target.value); setSelectedCustomerId(''); }}
            onFocus={() => setCustomerSearch(customerSearch || '')}
          />
          {(customerSearch || !selectedCustomerId) && filteredCustomers.length > 0 && customerSearch && (
            <div className="pos-customer-dropdown">
              <div className="pos-customer-option" onClick={() => { setSelectedCustomerId(''); setCustomerSearch('Guest Walk-in'); }}>
                <span>Guest Walk-in (No Credit)</span>
              </div>
              {filteredCustomers.map(c => (
                <div key={c.id} className="pos-customer-option"
                  onClick={() => { setSelectedCustomerId(String(c.id)); setCustomerSearch(`${c.name} - ${c.phone}`); }}>
                  <span style={{fontWeight: 500}}>{c.name}</span>
                  <span className="text-secondary" style={{fontSize: '12px'}}>{c.phone}</span>
                </div>
              ))}
            </div>
          )}
          {!customerSearch && (
            <select className="form-input mt-2" value={selectedCustomerId}
              onChange={e => {
                setSelectedCustomerId(e.target.value);
                const c = customers.find(c => c.id === parseInt(e.target.value));
                setCustomerSearch(c ? `${c.name} - ${c.phone}` : '');
              }}>
              <option value="">Guest Walk-in (No Credit)</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
            </select>
          )}
        </div>

        {/* Cart Items */}
        <div className="pos-cart-items">
          {cart.length === 0 && (
            <div className="pos-cart-empty">
              <ShoppingCart size={32} />
              <p>Cart is empty</p>
              <small>Select products to begin</small>
            </div>
          )}
          {cart.map(item => {
            const isDecimal = DECIMAL_UNITS.includes(item.unit || 'pcs');
            return (
              <div key={item.productId} className="pos-cart-item">
                <div className="pos-cart-item-top">
                  <strong>{item.name}</strong>
                  <button onClick={() => removeFromCart(item.productId)} className="pos-cart-remove">
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="pos-cart-item-controls">
                  <div className="pos-qty-stepper">
                    <button className="pos-qty-btn" onClick={() => updateQuantity(item.productId, isDecimal ? -0.5 : -1)}>
                      <Minus size={14} />
                    </button>
                    <input type="number" className="pos-qty-input"
                      step={isDecimal ? '0.01' : '1'} min={isDecimal ? '0.01' : '1'}
                      value={item.quantity}
                      onChange={e => updateCartItem(item.productId, 'quantity', parseFloat(e.target.value) || 1)} />
                    <button className="pos-qty-btn" onClick={() => updateQuantity(item.productId, isDecimal ? 0.5 : 1)}>
                      <Plus size={14} />
                    </button>
                    <span className="pos-qty-unit">{item.unit}</span>
                  </div>
                  <div className="pos-price-edit">
                    <span style={{fontSize: '12px', color: 'var(--text-secondary)'}}>₹</span>
                    <input type="number" step="0.01" className="pos-price-input"
                      value={item.actualSellingPrice}
                      onChange={e => updateCartItem(item.productId, 'actualSellingPrice', e.target.value)} />
                  </div>
                </div>
                <div className="pos-cart-item-subtotal">
                  ₹{(item.quantity * (parseFloat(item.actualSellingPrice) || 0)).toFixed(2)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary & Checkout */}
        <div className="pos-cart-footer">
          <div className="pos-summary">
            <div className="pos-summary-row">
              <span>Items</span>
              <span>{cartItemCount}</span>
            </div>
            <div className="pos-summary-row pos-summary-total">
              <span>Total</span>
              <span>₹{totalValue.toFixed(2)}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Amount Paid (₹)</label>
            <input type="number" step="0.01" className="form-input"
              placeholder={`Full: ₹${totalValue.toFixed(2)}`}
              value={amountPaidUpfront} onChange={e => setAmountPaidUpfront(e.target.value)} />
            {balanceAdded > 0 && selectedCustomerId && (
              <small className="text-secondary" style={{ display: 'block', marginTop: '4px' }}>
                ₹{balanceAdded.toFixed(2)} will be added to credit.
              </small>
            )}
            {balanceAdded > 0 && !selectedCustomerId && (
              <small className="text-danger" style={{ display: 'block', marginTop: '4px' }}>
                Guest checkout requires full payment.
              </small>
            )}
          </div>

          <button
            className="btn btn-primary pos-checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0 || (!selectedCustomerId && balanceAdded > 0)}
          >
            <CheckCircle size={18} /> Process Sale — ₹{totalValue.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div className="modal-overlay">
          <div className="modal-content pos-receipt">
            <div className="pos-receipt-header">
              <CheckCircle size={40} className="text-success" />
              <h2>Sale Complete!</h2>
              <p className="text-secondary">Order #{showReceipt.orderId}</p>
            </div>
            <div className="pos-receipt-items">
              {showReceipt.items.map(item => (
                <div key={item.productId} className="pos-receipt-item">
                  <span>{item.quantity}x {item.name}</span>
                  <span>₹{(item.quantity * parseFloat(item.actualSellingPrice)).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="pos-receipt-totals">
              <div className="pos-receipt-row"><span>Total</span><span style={{fontWeight: 700}}>₹{showReceipt.total.toFixed(2)}</span></div>
              <div className="pos-receipt-row"><span>Paid</span><span>₹{showReceipt.paid.toFixed(2)}</span></div>
              {showReceipt.balance > 0 && (
                <div className="pos-receipt-row text-danger"><span>Credit</span><span>₹{showReceipt.balance.toFixed(2)}</span></div>
              )}
              {showReceipt.customer && (
                <div className="pos-receipt-row text-secondary"><span>Customer</span><span>{showReceipt.customer.name}</span></div>
              )}
            </div>
            <button className="btn btn-primary" style={{width: '100%', marginTop: '16px'}} onClick={closeReceipt}>
              Done — New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
