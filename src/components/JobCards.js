import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Save, Eye, FileText } from 'lucide-react';

function JobCards({ jobCards, addJobCard, updateJobCard, deleteJobCard, stock, updateStock, assets, currency, inventoryMethod }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    assetId: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    items: [],
    laborCost: 0,
    status: 'draft'
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

  // Calculate cost based on inventory method
  const calculateItemCost = (stockItem, quantityNeeded) => {
    if (!stockItem || !stockItem.batches) return { cost: 0, batches: [] };

    if (inventoryMethod === 'FIFO') {
      // FIFO: Use oldest batches first
      let remaining = quantityNeeded;
      let totalCost = 0;
      const batchesUsed = [];
      
      // Sort batches by date (oldest first)
      const sortedBatches = [...stockItem.batches].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      for (const batch of sortedBatches) {
        if (remaining <= 0) break;
        
        const quantityFromBatch = Math.min(batch.quantity, remaining);
        totalCost += quantityFromBatch * batch.unitCost;
        batchesUsed.push({
          batchId: batch.batchId,
          quantity: quantityFromBatch,
          unitCost: batch.unitCost
        });
        remaining -= quantityFromBatch;
      }
      
      return { cost: totalCost, batches: batchesUsed };
    } else {
      // Weighted Average: Use average cost
      const avgCost = stockItem.averageCost || 0;
      return {
        cost: quantityNeeded * avgCost,
        batches: [{ quantity: quantityNeeded, unitCost: avgCost }]
      };
    }
  };

  // Deduct stock using FIFO or update batches
  const deductStock = (stockItem, quantityNeeded) => {
    if (inventoryMethod === 'FIFO') {
      // FIFO: Deduct from oldest batches first
      let remaining = quantityNeeded;
      const updatedBatches = [];
      
      // Sort batches by date (oldest first)
      const sortedBatches = [...stockItem.batches].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );
      
      for (const batch of sortedBatches) {
        if (remaining <= 0) {
          updatedBatches.push(batch);
        } else if (batch.quantity <= remaining) {
          // Use entire batch
          remaining -= batch.quantity;
          // Don't add batch (it's used up)
        } else {
          // Partially use batch
          updatedBatches.push({
            ...batch,
            quantity: batch.quantity - remaining
          });
          remaining = 0;
        }
      }
      
      // Recalculate totals
      const totalQuantity = updatedBatches.reduce((sum, batch) => sum + batch.quantity, 0);
      const totalCost = updatedBatches.reduce((sum, batch) => sum + (batch.quantity * batch.unitCost), 0);
      const averageCost = totalQuantity > 0 ? totalCost / totalQuantity : 0;
      
      return {
        ...stockItem,
        batches: updatedBatches,
        totalQuantity,
        averageCost
      };
    } else {
      // Weighted Average: Proportionally reduce all batches
      const reductionRatio = (stockItem.totalQuantity - quantityNeeded) / stockItem.totalQuantity;
      const updatedBatches = stockItem.batches.map(batch => ({
        ...batch,
        quantity: Math.round(batch.quantity * reductionRatio * 100) / 100
      })).filter(batch => batch.quantity > 0);
      
      const totalQuantity = stockItem.totalQuantity - quantityNeeded;
      
      return {
        ...stockItem,
        batches: updatedBatches,
        totalQuantity,
        averageCost: stockItem.averageCost // Average cost doesn't change
      };
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId !== null) {
      updateJobCard(editingId, formData);
      setEditingId(null);
    } else {
      addJobCard(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      assetId: '',
      date: new Date().toISOString().split('T')[0],
      description: '',
      items: [],
      laborCost: 0,
      status: 'draft'
    });
    setIsCreating(false);
  };

  const handleEdit = (jobCard) => {
    setFormData(jobCard);
    setEditingId(jobCard.id);
    setIsCreating(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this job card?')) {
      deleteJobCard(id);
    }
  };

  const addItemToJobCard = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { stockId: '', quantity: 1, description: '', actualCost: 0 }]
    });
  };

  const updateJobCardItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Recalculate cost when stockId or quantity changes
    if (field === 'stockId' || field === 'quantity') {
      const stockItem = stock.find(s => s.id === parseInt(newItems[index].stockId));
      if (stockItem && newItems[index].quantity > 0) {
        const { cost } = calculateItemCost(stockItem, newItems[index].quantity);
        newItems[index].actualCost = cost;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const removeJobCardItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const saveJobCard = () => {
    // Validate stock availability
    for (const item of formData.items) {
      if (item.stockId) {
        const stockItem = stock.find(s => s.id === parseInt(item.stockId));
        if (stockItem) {
          if (stockItem.totalQuantity < item.quantity) {
            alert(`Not enough stock for ${stockItem.name}. Available: ${stockItem.totalQuantity}`);
            return;
          }
        }
      }
    }

    // Calculate actual costs and deduct stock
    const itemsWithCosts = formData.items.map(item => {
      const stockItem = stock.find(s => s.id === parseInt(item.stockId));
      if (stockItem) {
        const { cost } = calculateItemCost(stockItem, item.quantity);
        return { ...item, actualCost: cost };
      }
      return item;
    });

    const updatedFormData = { 
      ...formData, 
      items: itemsWithCosts,
      status: 'completed',
      costingMethod: inventoryMethod // Save which method was used
    };
    
    // Deduct stock and record usage
    formData.items.forEach(item => {
      if (item.stockId) {
        const stockItem = stock.find(s => s.id === parseInt(item.stockId));
        if (stockItem) {
          const updatedStock = deductStock(stockItem, item.quantity);
          
          // Add usage history
          const usageRecord = {
            date: formData.date,
            quantity: item.quantity,
            cost: calculateItemCost(stockItem, item.quantity).cost,
            jobCardTitle: formData.title,
            assetName: assets.find(a => a.id === parseInt(formData.assetId))?.name || 'Unknown'
          };
          
          // Initialize usageHistory if it doesn't exist
          if (!updatedStock.usageHistory) {
            updatedStock.usageHistory = [];
          }
          updatedStock.usageHistory.push(usageRecord);
          
          updateStock(stockItem.id, updatedStock);
        }
      }
    });

    if (editingId !== null) {
      updateJobCard(editingId, updatedFormData);
      setEditingId(null);
    } else {
      addJobCard(updatedFormData);
    }
    resetForm();
  };

  const calculateTotal = () => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      if (item.stockId) {
        const stockItem = stock.find(s => s.id === parseInt(item.stockId));
        if (stockItem) {
          const { cost } = calculateItemCost(stockItem, item.quantity);
          return sum + cost;
        }
      }
      return sum;
    }, 0);
    return itemsTotal + parseFloat(formData.laborCost || 0);
  };

  const getJobCardTotal = (jobCard) => {
    const itemsTotal = jobCard.items ? jobCard.items.reduce((sum, item) => {
      return sum + (item.actualCost || 0);
    }, 0) : 0;
    return itemsTotal + parseFloat(jobCard.laborCost || 0);
  };

  const viewJobCard = (jobCard) => {
    setViewingId(jobCard.id);
  };

  const viewingJobCard = jobCards.find(jc => jc.id === viewingId);

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Job Cards</h2>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span className="inventory-method-badge">
            Costing: {inventoryMethod === 'FIFO' ? 'FIFO' : 'Weighted Avg'}
          </span>
          <button className="btn btn-primary" onClick={() => setIsCreating(true)}>
            <Plus size={20} /> Create Job Card
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-box">
          <h3>Total Job Cards</h3>
          <p className="stat-value">{jobCards.length}</p>
        </div>
        <div className="stat-box">
          <h3>Completed</h3>
          <p className="stat-value">{jobCards.filter(jc => jc.status === 'completed').length}</p>
        </div>
        <div className="stat-box">
          <h3>Draft</h3>
          <p className="stat-value">{jobCards.filter(jc => jc.status === 'draft').length}</p>
        </div>
      </div>

      {isCreating && (
        <div className="modal-overlay" onClick={() => !editingId && resetForm()}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Edit Job Card' : 'Create Job Card'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Job Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Asset *</label>
                  <select
                    value={formData.assetId}
                    onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                    required
                  >
                    <option value="">Select Asset</option>
                    {assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.name} ({asset.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Labor Cost ({getCurrencySymbol()})</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.laborCost}
                    onChange={(e) => setFormData({ ...formData, laborCost: parseFloat(e.target.value) || 0 })}
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

              <div className="items-section">
                <div className="section-header">
                  <h4>Items Used (Costing Method: {inventoryMethod})</h4>
                  <button type="button" className="btn btn-sm btn-secondary" onClick={addItemToJobCard}>
                    <Plus size={16} /> Add Item
                  </button>
                </div>
                
                {formData.items.map((item, index) => {
                  const stockItem = stock.find(s => s.id === parseInt(item.stockId));
                  const itemCost = stockItem ? calculateItemCost(stockItem, item.quantity).cost : 0;
                  
                  return (
                    <div key={index} className="item-row">
                      <select
                        value={item.stockId}
                        onChange={(e) => updateJobCardItem(index, 'stockId', e.target.value)}
                        required
                      >
                        <option value="">Select Item</option>
                        {stock.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} (Available: {s.totalQuantity})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateJobCardItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        required
                      />
                      <input
                        type="text"
                        placeholder="Notes (optional)"
                        value={item.description}
                        onChange={(e) => updateJobCardItem(index, 'description', e.target.value)}
                      />
                      {item.stockId && (
                        <span className="item-cost">
                          {getCurrencySymbol()}{itemCost.toFixed(2)}
                        </span>
                      )}
                      <button type="button" className="icon-btn danger" onClick={() => removeJobCardItem(index)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="total-section">
                <strong>Total Cost: {getCurrencySymbol()}{calculateTotal().toFixed(2)}</strong>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-secondary">
                  <Save size={16} /> Save as Draft
                </button>
                <button type="button" className="btn btn-primary" onClick={saveJobCard}>
                  <Save size={16} /> Save & Complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingId && viewingJobCard && (
        <div className="modal-overlay" onClick={() => setViewingId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Job Card Details</h3>
              <button className="close-btn" onClick={() => setViewingId(null)}>×</button>
            </div>
            <div className="job-card-view">
              <div className="detail-row">
                <strong>Job Title:</strong>
                <span>{viewingJobCard.title}</span>
              </div>
              <div className="detail-row">
                <strong>Asset:</strong>
                <span>{assets.find(a => a.id === parseInt(viewingJobCard.assetId))?.name || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <strong>Date:</strong>
                <span>{viewingJobCard.date}</span>
              </div>
              <div className="detail-row">
                <strong>Status:</strong>
                <span className={`status-badge ${viewingJobCard.status}`}>{viewingJobCard.status}</span>
              </div>
              {viewingJobCard.costingMethod && (
                <div className="detail-row">
                  <strong>Costing Method:</strong>
                  <span className="inventory-method-badge">{viewingJobCard.costingMethod}</span>
                </div>
              )}
              {viewingJobCard.description && (
                <div className="detail-row">
                  <strong>Description:</strong>
                  <span>{viewingJobCard.description}</span>
                </div>
              )}
              <div className="detail-row">
                <strong>Labor Cost:</strong>
                <span>{getCurrencySymbol()}{viewingJobCard.laborCost.toFixed(2)}</span>
              </div>
              
              <h4>Items Used:</h4>
              {viewingJobCard.items && viewingJobCard.items.length > 0 ? (
                <table className="detail-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingJobCard.items.map((item, idx) => {
                      const stockItem = stock.find(s => s.id === parseInt(item.stockId));
                      return (
                        <tr key={idx}>
                          <td>{stockItem?.name || 'Unknown'}</td>
                          <td>{item.quantity}</td>
                          <td>{getCurrencySymbol()}{(item.actualCost || 0).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <p>No items used</p>
              )}
              
              <div className="total-section">
                <strong>Total Cost: {getCurrencySymbol()}{getJobCardTotal(viewingJobCard).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="list-container">
        {jobCards.length === 0 ? (
          <div className="empty-list">
            <p>No job cards yet. Create your first job card to track workshop expenses!</p>
          </div>
        ) : (
          jobCards.map(jc => (
            <div key={jc.id} className="list-item">
              <div className="list-item-main">
                <div className="list-item-icon">
                  <FileText size={24} />
                </div>
                <div className="list-item-content">
                  <h3 className="list-item-title">{jc.title}</h3>
                  <p className="list-item-subtitle">
                    {assets.find(a => a.id === parseInt(jc.assetId))?.name || 'N/A'} • {jc.date}
                  </p>
                  <div className="list-item-details">
                    <div className="list-item-detail">
                      <span className="list-item-detail-label">Items</span>
                      <span className="list-item-detail-value">{jc.items?.length || 0}</span>
                    </div>
                    {jc.costingMethod && (
                      <div className="list-item-detail">
                        <span className="list-item-detail-label">Method</span>
                        <span className="list-item-detail-value">{jc.costingMethod}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <span className={`job-card-status ${jc.status}`}>{jc.status}</span>
              <div className="list-item-stat">
                <span className="list-item-stat-label">Total</span>
                <span className="list-item-stat-value">{getCurrencySymbol()}{getJobCardTotal(jc).toFixed(2)}</span>
              </div>
              <div className="list-item-actions">
                <button className="icon-btn" onClick={() => viewJobCard(jc)} title="View">
                  <Eye size={16} />
                </button>
                {jc.status === 'draft' && (
                  <button className="icon-btn" onClick={() => handleEdit(jc)} title="Edit">
                    <Edit2 size={16} />
                  </button>
                )}
                <button className="icon-btn danger" onClick={() => handleDelete(jc.id)} title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default JobCards;