import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Truck, Search, FileText, X, Check } from 'lucide-react';

const DEFAULT_ASSET_CATEGORIES = ['Vehicle', 'Trailer', 'Implement', 'Equipment', 'Other'];

function Assets({ assets, addAsset, updateAsset, deleteAsset, jobCards, currency, assetCategories = DEFAULT_ASSET_CATEGORIES, specificationCategories = [] }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSpecsAsset, setViewingSpecsAsset] = useState(null);

  // Spec entry state (used inside the add/edit modal)
  const [newSpecCategory, setNewSpecCategory] = useState('');
  const [newSpecValue, setNewSpecValue] = useState('');
  const [editingSpecIndex, setEditingSpecIndex] = useState(null);
  const [editSpecValue, setEditSpecValue] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: assetCategories[0] || 'Vehicle',
    registrationNumber: '',
    make: '',
    model: '',
    year: '',
    description: '',
    specifications: []
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
      type: assetCategories[0] || 'Vehicle',
      registrationNumber: '',
      make: '',
      model: '',
      year: '',
      description: '',
      specifications: []
    });
    setEditingSpecIndex(null);
    setEditSpecValue('');
    setNewSpecCategory('');
    setNewSpecValue('');
    setIsAdding(false);
  };

  const handleEdit = (asset) => {
    setFormData({ ...asset, specifications: asset.specifications || [] });
    setEditingId(asset.id);
    setEditingSpecIndex(null);
    setEditSpecValue('');
    setNewSpecCategory('');
    setNewSpecValue('');
    setIsAdding(true);
    setViewingSpecsAsset(null);
  };

  const handleAddSpec = () => {
    if (!newSpecCategory || !newSpecValue.trim()) return;
    setFormData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { category: newSpecCategory, value: newSpecValue.trim() }]
    }));
    setNewSpecValue('');
  };

  const handleDeleteSpec = (index) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
    if (editingSpecIndex === index) {
      setEditingSpecIndex(null);
      setEditSpecValue('');
    }
  };

  const handleStartEditSpec = (index) => {
    setEditingSpecIndex(index);
    setEditSpecValue(formData.specifications[index].value);
  };

  const handleSaveSpec = (index) => {
    if (!editSpecValue.trim()) return;
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.map((s, i) => i === index ? { ...s, value: editSpecValue.trim() } : s)
    }));
    setEditingSpecIndex(null);
    setEditSpecValue('');
  };

  const handleDelete = (id) => {
    const hasJobCards = jobCards.some(jc => jc.assetId === id);
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
    // Filter job cards for this asset
    const assetJobCards = jobCards.filter(jc =>
      jc.assetId === assetId && jc.status === 'completed'
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

  // Filter assets based on search term
  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (asset.registrationNumber && asset.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.make && asset.make.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (asset.model && asset.model.toLowerCase().includes(searchTerm.toLowerCase())) ||
    asset.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        {assetCategories.slice(0, 3).map(category => (
          <div key={category} className="stat-box">
            <h3>{category}s</h3>
            <p className="stat-value">{assets.filter(a => a.type === category).length}</p>
          </div>
        ))}
      </div>

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search assets..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
                    {assetCategories.map(type => (
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

              {/* Specification Sheet */}
              <div style={{ borderTop: '2px solid #e5e7eb', marginTop: '1rem', paddingTop: '1rem' }}>
                <h4 style={{ marginBottom: '0.75rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={18} /> Specification Sheet
                </h4>

                {formData.specifications.length > 0 && (
                  <div style={{ marginBottom: '0.75rem' }}>
                    {formData.specifications.map((spec, index) => (
                      <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0', borderBottom: '1px solid #f3f4f6' }}>
                        <span style={{ fontWeight: 600, minWidth: '140px', color: '#374151', fontSize: '0.875rem' }}>{spec.category}:</span>
                        {editingSpecIndex === index ? (
                          <>
                            <input
                              type="text"
                              value={editSpecValue}
                              onChange={(e) => setEditSpecValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveSpec(index);
                                if (e.key === 'Escape') { setEditingSpecIndex(null); setEditSpecValue(''); }
                              }}
                              autoFocus
                              style={{ flex: 1 }}
                            />
                            <button className="icon-btn success" onClick={() => handleSaveSpec(index)} title="Save"><Check size={14} /></button>
                            <button className="icon-btn" onClick={() => { setEditingSpecIndex(null); setEditSpecValue(''); }} title="Cancel"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <span style={{ flex: 1, color: '#6b7280', fontSize: '0.875rem' }}>{spec.value}</span>
                            <button className="icon-btn" onClick={() => handleStartEditSpec(index)} title="Edit"><Edit2 size={14} /></button>
                            <button className="icon-btn danger" onClick={() => handleDeleteSpec(index)} title="Delete"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {specificationCategories.length > 0 ? (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={newSpecCategory}
                      onChange={(e) => setNewSpecCategory(e.target.value)}
                      style={{ flex: '0 0 auto', minWidth: '150px' }}
                    >
                      <option value="">Select category...</option>
                      {specificationCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Enter value..."
                      value={newSpecValue}
                      onChange={(e) => setNewSpecValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddSpec()}
                      style={{ flex: 1, minWidth: '120px' }}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAddSpec}
                      disabled={!newSpecCategory || !newSpecValue.trim()}
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      <Plus size={14} /> Add Spec
                    </button>
                  </div>
                ) : (
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', fontStyle: 'italic' }}>
                    No specification categories configured. Add them in Settings first.
                  </p>
                )}
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
        {filteredAssets.length === 0 ? (
          <div className="empty-list">
            <p>{searchTerm ? 'No assets match your search' : 'No assets yet. Add your first vehicle, trailer, or implement to start tracking expenses!'}</p>
          </div>
        ) : (
          filteredAssets.map(asset => {
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
                  <button
                    className="icon-btn"
                    onClick={() => setViewingSpecsAsset(asset)}
                    title={`View Specs${asset.specifications && asset.specifications.length > 0 ? ` (${asset.specifications.length})` : ''}`}
                    style={{ position: 'relative' }}
                  >
                    <FileText size={16} />
                    {asset.specifications && asset.specifications.length > 0 && (
                      <span style={{
                        position: 'absolute', top: '-4px', right: '-4px',
                        background: '#3b82f6', color: 'white', borderRadius: '50%',
                        width: '14px', height: '14px', fontSize: '9px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700
                      }}>
                        {asset.specifications.length}
                      </span>
                    )}
                  </button>
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

      {/* View Specs Modal */}
      {viewingSpecsAsset && (
        <div className="modal-overlay" onClick={() => setViewingSpecsAsset(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} /> {viewingSpecsAsset.name} — Specifications
              </h3>
              <button className="close-btn" onClick={() => setViewingSpecsAsset(null)}>×</button>
            </div>
            <div style={{ padding: '1rem 0' }}>
              {viewingSpecsAsset.specifications && viewingSpecsAsset.specifications.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {viewingSpecsAsset.specifications.map((spec, index) => (
                      <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600, color: '#374151', width: '45%' }}>{spec.category}</td>
                        <td style={{ padding: '0.6rem 0.5rem', color: '#6b7280' }}>{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p style={{ color: '#9ca3af', fontStyle: 'italic', textAlign: 'center', padding: '1rem 0' }}>
                  No specifications added yet.
                </p>
              )}
            </div>
            <div className="form-actions">
              <button className="btn btn-secondary" onClick={() => setViewingSpecsAsset(null)}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => handleEdit(viewingSpecsAsset)}>
                Edit Specifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assets;
