import React, { useState } from 'react';
import { Plus, Edit2, Trash2, TrendingUp, Truck } from 'lucide-react';

function Assets({ assets, addAsset, updateAsset, deleteAsset, jobCards, currency }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Vehicle',
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    description: ''
  });

  const assetTypes = ['Vehicle', 'Trailer', 'Implement', 'Equipment', 'Other'];

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
      updateAsset(editingId, formData);
      setEditingId(null);
    } else {
      addAsset(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Vehicle',
      registrationNumber: '',
      make: '',
      model: '',
      year: '',
      description: ''
    });
    setIsAdding(false);
  };

  const handleEdit = (asset) => {
    setFormData(asset);
    setEditingId(asset.id);
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    const hasJobCards = jobCards.some(jc => parseInt(jc.assetId) === parseInt(id));
    if (hasJobCards) {
      if (!window.confirm('This asset has job cards associated with it. Are you sure you want to delete it?')) {
        return;
      }
    }
    if (window.confirm('Are you sure you want to delete this asset?')) {
      deleteAsset(id);
    }
  };

  const getAssetStats = (assetId) => {
    // Filter job cards for this asset (handle both string and number IDs)
    const assetJobCards = jobCards.filter(jc => 
      parseInt(jc.assetId) === parseInt(assetId) && jc.status === 'completed'
    );
    
    const totalCost = assetJobCards.reduce((sum, jc) => {
      // Use actualCost if available (new batch system), otherwise calculate from unitCost
      const itemsCost = jc.items ? jc.items.reduce((itemSum, item) => {
        if (item.actualCost !== undefined) {
          // New system with actualCost stored in job card
          return itemSum + item.actualCost;
        } else {
          // Fallback for old system (shouldn't happen with new system)
          return itemSum + ((item.unitCost || 0) * item.quantity);
        }
      }, 0) : 0;
      return sum + itemsCost + (parseFloat(jc.laborCost) || 0);
    }, 0);
    
    return {
      jobCardCount: assetJobCards.length,
      totalCost: totalCost
    };
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Assets</h2>
        <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
          <Plus size={20} /> Add Asset
        </button>
      </div>

      <div className="stats-bar">
        <div className="stat-box">
          <h3>Total Assets</h3>
          <p className="stat-value">{assets.length}</p>
        </div>
        <div className="stat-box">
          <h3>Vehicles</h3>
          <p className="stat-value">{assets.filter(a => a.type === 'Vehicle').length}</p>
        </div>
        <div className="stat-box">
          <h3>Trailers</h3>
          <p className="stat-value">{assets.filter(a => a.type === 'Trailer').length}</p>
        </div>
        <div className="stat-box">
          <h3>Implements</h3>
          <p className="stat-value">{assets.filter(a => a.type === 'Implement').length}</p>
        </div>
      </div>

      {isAdding && (
        <div className="modal-overlay" onClick={() => !editingId && resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Asset' : 'Add Asset'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Asset Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    required
                  >
                    {assetTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Registration/ID Number</label>
                  <input
                    type="text"
                    value={formData.registrationNumber}
                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Make</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Model</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId !== null ? 'Update' : 'Add'} Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="list-container">
        {assets.length === 0 ? (
          <div className="empty-list">
            <p>No assets yet. Add your first vehicle, trailer, or implement to start tracking expenses!</p>
          </div>
        ) : (
          assets.map(asset => {
            const stats = getAssetStats(asset.id);
            return (
              <div key={asset.id} className="list-item">
                <div className="list-item-main">
                  <div className="list-item-icon">
                    <Truck size={24} />
                  </div>
                  <div className="list-item-content">
                    <h3 className="list-item-title">{asset.name}</h3>
                    <p className="list-item-subtitle">
                      {asset.type} {asset.registrationNumber && `• ${asset.registrationNumber}`}
                    </p>
                    <div className="list-item-details">
                      {asset.make && (
                        <div className="list-item-detail">
                          <span className="list-item-detail-label">Make</span>
                          <span className="list-item-detail-value">{asset.make}</span>
                        </div>
                      )}
                      {asset.model && (
                        <div className="list-item-detail">
                          <span className="list-item-detail-label">Model</span>
                          <span className="list-item-detail-value">{asset.model}</span>
                        </div>
                      )}
                      {asset.year && (
                        <div className="list-item-detail">
                          <span className="list-item-detail-label">Year</span>
                          <span className="list-item-detail-value">{asset.year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="list-item-stats">
                  <div className="list-item-stat">
                    <span className="list-item-stat-label">Job Cards</span>
                    <span className="list-item-stat-value">{stats.jobCardCount}</span>
                  </div>
                  <div className="list-item-stat">
                    <span className="list-item-stat-label">Total Expenses</span>
                    <span className="list-item-stat-value">{getCurrencySymbol()}{stats.totalCost.toFixed(2)}</span>
                  </div>
                </div>
                <div className="list-item-actions">
                  <button className="icon-btn" onClick={() => handleEdit(asset)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                  <button className="icon-btn danger" onClick={() => handleDelete(asset.id)} title="Delete">
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

export default Assets;