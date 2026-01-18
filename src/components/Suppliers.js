import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Building2, TrendingUp, Package } from 'lucide-react';

function Suppliers({ suppliers, addSupplier, updateSupplier, deleteSupplier, stock, currency }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const getCurrencySymbol = () => {
    const symbols = {
      'ZAR': 'R',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId !== null) {
      updateSupplier(editingId, formData);
      setEditingId(null);
    } else {
      addSupplier(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
    setIsAdding(false);
  };

  const handleEdit = (supplier) => {
    setFormData(supplier);
    setEditingId(supplier.id);
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    const hasStock = stock.some(item => parseInt(item.supplierId) === parseInt(id));
    if (hasStock) {
      if (!window.confirm('This supplier has stock items linked to it. Are you sure you want to delete it? The stock items will remain but lose their supplier link.')) {
        return;
      }
    }
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      deleteSupplier(id);
    }
  };

  const getSupplierStats = (supplierId) => {
    const supplierStock = stock.filter(item => parseInt(item.supplierId) === parseInt(supplierId));
    const totalItems = supplierStock.length;
    
    // Calculate current stock value using new batch system
    const totalValue = supplierStock.reduce((sum, item) => {
      // Use totalQuantity and averageCost if available (new batch system)
      if (item.totalQuantity !== undefined && item.averageCost !== undefined) {
        return sum + (item.totalQuantity * item.averageCost);
      }
      // Fallback to old system
      return sum + (item.quantity * item.unitCost);
    }, 0);
    
    // Calculate total spent from this supplier (sum of all purchase batches)
    const totalSpent = supplierStock.reduce((sum, item) => {
      if (item.batches && item.batches.length > 0) {
        // New batch system: sum all purchases
        return sum + item.batches.reduce((batchSum, batch) => {
          return batchSum + (batch.quantity * batch.unitCost);
        }, 0);
      }
      // Fallback to old system
      return sum + ((item.quantity || 0) * (item.unitCost || 0));
    }, 0);
    
    return {
      totalItems,
      totalValue,
      totalSpent
    };
  };

  const viewSupplier = (supplier) => {
    setViewingId(supplier.id);
  };

  const viewingSupplier = suppliers.find(s => s.id === viewingId);
  const supplierStock = viewingSupplier ? stock.filter(item => parseInt(item.supplierId) === parseInt(viewingId)) : [];

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Suppliers</h2>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={20} /> Add Supplier
        </button>
      </div>

      <div className="stats-bar">
        <div className="stat-box">
          <h3>Total Suppliers</h3>
          <p className="stat-value">{suppliers.length}</p>
        </div>
        <div className="stat-box">
          <h3>Active Suppliers</h3>
          <p className="stat-value">{suppliers.filter(s => stock.some(item => parseInt(item.supplierId) === parseInt(s.id))).length}</p>
        </div>
        <div className="stat-box">
          <h3>Total Stock Value</h3>
          <p className="stat-value">{getCurrencySymbol()}{stock.reduce((sum, item) => {
            if (item.totalQuantity !== undefined && item.averageCost !== undefined) {
              return sum + (item.totalQuantity * item.averageCost);
            }
            return sum + ((item.quantity || 0) * (item.unitCost || 0));
          }, 0).toFixed(2)}</p>
        </div>
      </div>

      {isAdding && (
        <div className="modal-overlay" onClick={() => !editingId && resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Supplier' : 'Add Supplier'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Supplier Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Contact Person</label>
                  <input
                    type="text"
                    value={formData.contactPerson}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="2"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId !== null ? 'Update' : 'Add'} Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingId && viewingSupplier && (
        <div className="modal-overlay" onClick={() => setViewingId(null)}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Supplier Details - {viewingSupplier.name}</h3>
              <button className="close-btn" onClick={() => setViewingId(null)}>×</button>
            </div>
            <div className="supplier-view">
              <div className="supplier-info-section">
                <h4><Building2 size={20} /> Contact Information</h4>
                <div className="info-grid">
                  {viewingSupplier.contactPerson && (
                    <div className="info-item">
                      <strong>Contact Person:</strong>
                      <span>{viewingSupplier.contactPerson}</span>
                    </div>
                  )}
                  {viewingSupplier.email && (
                    <div className="info-item">
                      <strong>Email:</strong>
                      <span>{viewingSupplier.email}</span>
                    </div>
                  )}
                  {viewingSupplier.phone && (
                    <div className="info-item">
                      <strong>Phone:</strong>
                      <span>{viewingSupplier.phone}</span>
                    </div>
                  )}
                  {viewingSupplier.address && (
                    <div className="info-item full-width">
                      <strong>Address:</strong>
                      <span>{viewingSupplier.address}</span>
                    </div>
                  )}
                  {viewingSupplier.notes && (
                    <div className="info-item full-width">
                      <strong>Notes:</strong>
                      <span>{viewingSupplier.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="supplier-stats-section">
                <h4><TrendingUp size={20} /> Purchase Summary</h4>
                <div className="stats-grid-inline">
                  <div className="stat-item-inline">
                    <span className="stat-label">Total Items</span>
                    <span className="stat-value">{supplierStock.length}</span>
                  </div>
                  <div className="stat-item-inline">
                    <span className="stat-label">Current Stock Value</span>
                    <span className="stat-value">{getCurrencySymbol()}{getSupplierStats(viewingId).totalValue.toFixed(2)}</span>
                  </div>
                  <div className="stat-item-inline">
                    <span className="stat-label">Total Purchased</span>
                    <span className="stat-value">{getCurrencySymbol()}{getSupplierStats(viewingId).totalSpent.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="supplier-items-section">
                <h4><Package size={20} /> Stock Items from this Supplier</h4>
                {supplierStock.length > 0 ? (
                  <table className="detail-table">
                    <thead>
                      <tr>
                        <th>Item Name</th>
                        <th>Part Number</th>
                        <th>Category</th>
                        <th>Current Qty</th>
                        <th>Avg Cost</th>
                        <th>Stock Value</th>
                        <th>Total Purchased</th>
                      </tr>
                    </thead>
                    <tbody>
                      {supplierStock.map(item => {
                        const qty = item.totalQuantity !== undefined ? item.totalQuantity : item.quantity;
                        const avgCost = item.averageCost !== undefined ? item.averageCost : item.unitCost;
                        const stockValue = qty * avgCost;
                        
                        // Calculate total purchased from batches
                        const totalPurchased = item.batches && item.batches.length > 0
                          ? item.batches.reduce((sum, batch) => sum + (batch.quantity * batch.unitCost), 0)
                          : stockValue;
                        
                        return (
                          <tr key={item.id}>
                            <td>{item.name}</td>
                            <td>{item.partNumber || '-'}</td>
                            <td><span className="badge">{item.category}</span></td>
                            <td>{qty}</td>
                            <td>{getCurrencySymbol()}{avgCost.toFixed(2)}</td>
                            <td>{getCurrencySymbol()}{stockValue.toFixed(2)}</td>
                            <td>{getCurrencySymbol()}{totalPurchased.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-items">No stock items from this supplier yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="list-container">
        {suppliers.length === 0 ? (
          <div className="empty-list">
            <p>No suppliers yet. Add your first supplier to start tracking purchases!</p>
          </div>
        ) : (
          suppliers.map(supplier => {
            const stats = getSupplierStats(supplier.id);
            return (
              <div key={supplier.id} className="list-item">
                <div className="list-item-main">
                  <div className="list-item-icon">
                    <Building2 size={24} />
                  </div>
                  <div className="list-item-content">
                    <h3 className="list-item-title">{supplier.name}</h3>
                    <p className="list-item-subtitle">
                      {supplier.contactPerson && `${supplier.contactPerson}`}
                      {supplier.contactPerson && (supplier.email || supplier.phone) && ' • '}
                      {supplier.email || supplier.phone}
                    </p>
                    <div className="list-item-details">
                      <div className="list-item-detail">
                        <span className="list-item-detail-label">Items</span>
                        <span className="list-item-detail-value">{stats.totalItems}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="list-item-stats">
                  <div className="list-item-stat">
                    <span className="list-item-stat-label">Stock Value</span>
                    <span className="list-item-stat-value">{getCurrencySymbol()}{stats.totalValue.toFixed(2)}</span>
                  </div>
                  <div className="list-item-stat">
                    <span className="list-item-stat-label">Total Spent</span>
                    <span className="list-item-stat-value">{getCurrencySymbol()}{stats.totalSpent.toFixed(2)}</span>
                  </div>
                </div>
                <div className="list-item-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => viewSupplier(supplier)}>
                    View Details
                  </button>
                  <button className="icon-btn" onClick={() => handleEdit(supplier)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(supplier.id)} title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Suppliers;