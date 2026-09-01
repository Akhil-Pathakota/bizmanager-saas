import React, { useEffect, useState, useRef } from 'react';
import { Plus, Edit2, Trash2, Camera, X, Image as ImageIcon } from 'lucide-react';
import api from '../api';
import { useAuth } from '../AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'https://bizmanager.pythonanywhere.com';

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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadProducts = () => {
    api.get('/api/products').then(res => setProducts(res.data)).catch(console.error);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    try {
      const submitData = { ...formData };
      if (!isOwner) delete submitData.purchaseCost;

      let productId = editingId;

      if (editingId) {
        await api.put(`/api/products/${editingId}`, submitData);
      } else {
        const res = await api.post('/api/products', submitData);
        productId = res.data.id;
      }

      // Upload image if a new file was selected
      if (imageFile && productId) {
        const fd = new FormData();
        fd.append('image', imageFile);
        await api.post(`/api/products/${productId}/image`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      // Remove image if user cleared it (had an existing one but removed it)
      if (!imageFile && !imagePreview && existingImageUrl && productId) {
        await api.delete(`/api/products/${productId}/image`);
      }

      loadProducts();
      closeModal();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to save product.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to delete this product?')) {
      api.delete(`/api/products/${id}`)
        .then(() => loadProducts())
        .catch(err => alert(err.response?.data?.error || 'Failed to delete product.'));
    }
  };

  const openModal = (product = null) => {
    if (product) {
      setFormData({ ...product, unit: product.unit || 'pcs', purchaseCost: product.purchaseCost || 0 });
      setEditingId(product.id);
      if (product.imageUrl) {
        setExistingImageUrl(product.imageUrl);
        setImagePreview(`${API_BASE}${product.imageUrl}`);
      } else {
        setExistingImageUrl(null);
        setImagePreview(null);
      }
    } else {
      setFormData({ name: '', category: '', purchaseCost: 0, defaultSellingPrice: 0, currentStock: 0, unit: 'pcs' });
      setEditingId(null);
      setExistingImageUrl(null);
      setImagePreview(null);
    }
    setImageFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setImageFile(null);
    setImagePreview(null);
    setExistingImageUrl(null);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a PNG, JPG, or WebP image.');
      return;
    }

    // Validate size (5 MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5 MB.');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isDecimalUnit = DECIMAL_UNITS.includes(formData.unit);

  const getProductImageSrc = (p) => {
    if (p.imageUrl) return p.imageUrl;
    return null;
  };

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
              <th>Product</th>
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
            {products.map(p => {
              const imgSrc = getProductImageSrc(p);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="product-name-cell">
                      <div className="product-thumb">
                        {imgSrc ? (
                          <img src={imgSrc} alt={p.name} />
                        ) : (
                          <ImageIcon size={18} strokeWidth={1.5} />
                        )}
                      </div>
                      <span className="product-name-text">{p.name}</span>
                    </div>
                  </td>
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
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="mb-4">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              {/* Image Upload Area */}
              <div className="form-group">
                <label className="form-label">Product Photo</label>
                <div className="image-upload-area" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <div className="image-preview-wrapper">
                      <img src={imagePreview} alt="Preview" className="image-preview" />
                      <button
                        type="button"
                        className="image-remove-btn"
                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="image-upload-placeholder">
                      <Camera size={28} strokeWidth={1.5} />
                      <span>Click to add photo</span>
                      <span className="image-upload-hint">PNG, JPG or WebP · Max 5 MB</span>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

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
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
