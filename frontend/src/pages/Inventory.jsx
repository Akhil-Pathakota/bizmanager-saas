import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

const UNIT_OPTIONS = [
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'units', label: 'Units' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'pair', label: 'Pair' },
  { value: 'set', label: 'Set' },
  { value: 'roll', label: 'Roll' },
  { value: 'bundle', label: 'Bundle' },
  { value: 'bag', label: 'Bag' },
  // Weight
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'g', label: 'Grams (g)' },
  { value: 'mg', label: 'Milligrams (mg)' },
  { value: 'lb', label: 'Pounds (lb)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'ton', label: 'Tonnes (ton)' },
  { value: 'quintal', label: 'Quintal' },
  // Length
  { value: 'ft', label: 'Feet (ft)' },
  { value: 'in', label: 'Inches (in)' },
  { value: 'm', label: 'Meters (m)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: 'mm', label: 'Millimeters (mm)' },
  { value: 'yd', label: 'Yards (yd)' },
  { value: 'km', label: 'Kilometers (km)' },
  // Volume / Liquid
  { value: 'L', label: 'Liters (L)' },
  { value: 'mL', label: 'Milliliters (mL)' },
  { value: 'gal', label: 'Gallons (gal)' },
  { value: 'qt', label: 'Quarts (qt)' },
  // Area
  { value: 'sqft', label: 'Sq. Feet (sqft)' },
  { value: 'sqm', label: 'Sq. Meters (sqm)' },
  // Other
  { value: 'sheet', label: 'Sheet' },
  { value: 'plate', label: 'Plate' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'can', label: 'Can' },
  { value: 'jar', label: 'Jar' },
  { value: 'tube', label: 'Tube' },
  { value: 'carton', label: 'Carton' },
  { value: 'sack', label: 'Sack' },
];

// Units that allow decimal quantities
const DECIMAL_UNITS = ['kg', 'g', 'mg', 'lb', 'oz', 'ton', 'quintal', 'ft', 'in', 'm', 'cm', 'mm', 'yd', 'km', 'L', 'mL', 'gal', 'qt', 'sqft', 'sqm'];

export default function Inventory() {
  const { isOwner } = useAuth();
  const [products, setProducts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', category: '', purchaseCost: 0, defaultSellingPrice: 0, currentStock: 0, unit: 'pcs' });
  const [editingId, setEditingId] = useState(null);

  const loadProducts = () => {
    api.get('/products').then(res => setProducts(res.data)).catch(console.error);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (!isOwner) delete submitData.purchaseCost;
    
    if (editingId) {
      api.put(`/products/${editingId}`, submitData).then(() => {
        loadProducts();
        closeModal();
      }).catch(console.error);
    } else {
      api.post('/products', submitData).then(() => {
        loadProducts();
        closeModal();
      }).catch(console.error);
    }
  };

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      api.delete(`/products/${id}`)
        .then(() => loadProducts())
        .catch(err => alert(err.response?.data?.error || 'Failed to delete product.'));
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setFormData({ ...product, unit: product.unit || 'pcs', purchaseCost: product.purchaseCost || 0 });
      setEditingId(product.id);
    } else {
      setFormData({ name: '', category: '', purchaseCost: 0, defaultSellingPrice: 0, currentStock: 0, unit: 'pcs' });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const isDecimalUnit = DECIMAL_UNITS.includes(formData.unit);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Inventory Management</h1>
        <button className="btn btn-primary" onClick={() => openModal()}><Plus size={16}/> Add Product</button>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              {isOwner && <th>Investment/Cost</th>}
              <th>Base Price</th>
              <th>Stock</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr><td colSpan={isOwner ? 6 : 5} className="text-center text-secondary">No products found. Add one to get started.</td></tr>
            )}
            {products.map(p => (
              <tr key={p.id}>
                <td style={{fontWeight: 600}}>{p.name}</td>
                <td>{p.category}</td>
                {isOwner && <td>₹{Number(p.purchaseCost).toFixed(2)}</td>}
                <td>₹{Number(p.defaultSellingPrice).toFixed(2)}</td>
                <td>
                  <span className={`badge ${p.currentStock > 5 ? 'badge-success' : p.currentStock > 0 ? 'badge-warning' : 'badge-danger'}`}>
                    {p.currentStock} {p.unit || 'pcs'}
                  </span>
                </td>
                <td className="text-right flex items-center gap-2" style={{justifyContent: 'flex-end'}}>
                  <button className="btn btn-outline" style={{padding: '6px 10px'}} onClick={() => openModal(p)}><Edit2 size={14}/></button>
                  <button className="btn btn-danger" style={{padding: '6px 10px'}} onClick={() => handleDelete(p.id)}><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input required className="form-input" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" type="text" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
              </div>
              <div className="flex gap-4">
                {isOwner && (
                  <div className="form-group w-full">
                    <label className="form-label">Purchase Cost (₹)</label>
                    <input required className="form-input" type="number" step="0.01" value={formData.purchaseCost} onChange={e => setFormData({...formData, purchaseCost: e.target.value})} />
                  </div>
                )}
                <div className="form-group w-full">
                  <label className="form-label">Default Selling Price (₹)</label>
                  <input required className="form-input" type="number" step="0.01" value={formData.defaultSellingPrice} onChange={e => setFormData({...formData, defaultSellingPrice: e.target.value})} />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="form-group w-full">
                  <label className="form-label">Stock Quantity</label>
                  <input required className="form-input" type="number" step={isDecimalUnit ? '0.01' : '1'} value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value})} />
                </div>
                <div className="form-group w-full">
                  <label className="form-label">Unit of Measurement</label>
                  <select className="form-input" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    {UNIT_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex justify-between mt-4">
                <button type="button" className="btn btn-outline" onClick={closeModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
