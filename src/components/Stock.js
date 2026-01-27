import React, { useState } from 'react';
import { Plus, Trash2, Search, ChevronDown, ChevronUp, History, FileText } from 'lucide-react';
import PurchaseInvoice from './PurchaseInvoice';
import * as api from '../lib/firebaseApi';

function Stock({ stock, addStock, updateStock, deleteStock, currency, suppliers, currentUser }) {
  const [isAdding, setIsAdding] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItems, setExpandedItems] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    partNumber: '',
    quantity: 0,
    unitCost: 0,
    category: 'Parts',
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const categories = ['Parts', 'Fluids', 'Filters', 'Consumables', 'Tools', 'Other'];

  const getCurrencySymbol = () => {
    const symbols = {
      'ZAR': 'R',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  };

  // Calculate average cost from batches
  const calculateAverageCost = (batches) => {
    if (!batches || batches.length === 0) return 0;
    const totalCost = batches.reduce((sum, batch) => sum + (batch.quantity * batch.unitCost), 0);
    const totalQuantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  // Get total quantity from batches
  const getTotalQuantity = (batches) => {
    if (!batches || batches.length === 0) return 0;
    return batches.reduce((sum, batch) => sum + batch.quantity, 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingId !== null) {
      // Editing existing item - add new batch or update existing batch with same price
      const existingItem = stock.find(item => item.id === editingId);
      const batches = existingItem.batches || [];
      
      // Check if there's a batch with the same unit cost
      const samePriceBatchIndex = batches.findIndex(batch => 
        Math.abs(batch.unitCost - formData.unitCost) < 0.01
      );
      
      let updatedBatches;
      if (samePriceBatchIndex !== -1) {
        // Add to existing batch with same price
        updatedBatches = [...batches];
        updatedBatches[samePriceBatchIndex].quantity += formData.quantity;
        updatedBatches[samePriceBatchIndex].date = formData.purchaseDate; // Update date
      } else {
        // Create new batch
        const newBatch = {
          batchId: Date.now(),
          date: formData.purchaseDate,
          quantity: formData.quantity,
          unitCost: formData.unitCost
        };
        updatedBatches = [...batches, newBatch];
      }
      
      // Sort batches by date (oldest first for FIFO)
      updatedBatches.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      const updatedItem = {
        ...existingItem,
        name: formData.name,
        description: formData.description,
        partNumber: formData.partNumber,
        category: formData.category,
        supplierId: formData.supplierId,
        batches: updatedBatches,
        totalQuantity: getTotalQuantity(updatedBatches),
        averageCost: calculateAverageCost(updatedBatches)
      };
      
      updateStock(editingId, updatedItem);
      setEditingId(null);
    } else {
      // Adding new item
      const newItem = {
        name: formData.name,
        description: formData.description,
        partNumber: formData.partNumber,
        category: formData.category,
        supplierId: formData.supplierId,
        batches: [{
          batchId: Date.now(),
          date: formData.purchaseDate,
          quantity: formData.quantity,
          unitCost: formData.unitCost
        }],
        totalQuantity: formData.quantity,
        averageCost: formData.unitCost
      };
      addStock(newItem);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      partNumber: '',
      quantity: 0,
      unitCost: 0,
      category: 'Parts',
      supplierId: '',
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setIsAdding(false);
  };

  const handleEdit = (item) => {
    // For editing, we'll be adding a new purchase batch
    setFormData({
      name: item.name,
      description: item.description,
      partNumber: item.partNumber,
      quantity: 0, // Start with 0 for new purchase
      unitCost: item.averageCost, // Default to average cost
      category: item.category,
      supplierId: item.supplierId,
      purchaseDate: new Date().toISOString().split('T')[0]
    });
    setEditingId(item.id);
    setIsAdding(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this item and all its purchase history?')) {
      deleteStock(id);
    }
  };

  const handleInvoiceSave = async (invoiceData) => {
    if (!currentUser?.uid) {
      alert('Error: User not logged in. Please refresh and try again.');
      return;
    }

    try {
      console.log('Processing invoice with', invoiceData.items.length, 'items');

      // Process each item in the invoice
      for (const item of invoiceData.items) {
        console.log('Processing item:', item.name || item.stockId, 'qty:', item.quantity);

        if (item.stockId === 'new') {
          // Create new stock item with batch included
          const newBatch = {
            batchId: Date.now().toString(),
            date: invoiceData.invoiceDate,
            quantity: item.quantity,
            unitCost: item.unitCost,
            invoiceNumber: invoiceData.invoiceNumber
          };

          const newItem = {
            name: item.name,
            description: item.description,
            partNumber: item.partNumber,
            category: item.category,
            supplierId: invoiceData.supplierId,
            totalQuantity: item.quantity,
            averageCost: item.unitCost,
            batches: [newBatch],  // Include batch in local state
            usageHistory: []
          };

          // Add stock item to Firebase
          const createdStock = await addStock(newItem);
          console.log('Created stock item:', createdStock.id, 'totalQuantity:', createdStock.totalQuantity);

          // Create batch record in stock_batches collection
          console.log('Creating batch for stock:', createdStock.id);
          await api.addStockBatch(createdStock.id, {
            date: invoiceData.invoiceDate,
            quantity: item.quantity,
            unitCost: item.unitCost,
            invoiceNumber: invoiceData.invoiceNumber
          }, currentUser.uid);

        } else {
          // Add to existing stock item
          const existingItem = stock.find(s => s.id === item.stockId);
          if (existingItem) {
            // Calculate new totals using weighted average
            const newQuantity = (existingItem.totalQuantity || 0) + item.quantity;
            const existingValue = (existingItem.totalQuantity || 0) * (existingItem.averageCost || 0);
            const newValue = item.quantity * item.unitCost;
            const newAverageCost = newQuantity > 0 ? (existingValue + newValue) / newQuantity : 0;

            // Create new batch for local state
            const newBatch = {
              batchId: Date.now().toString(),
              date: invoiceData.invoiceDate,
              quantity: item.quantity,
              unitCost: item.unitCost,
              invoiceNumber: invoiceData.invoiceNumber
            };

            const updatedItem = {
              ...existingItem,
              totalQuantity: newQuantity,
              averageCost: newAverageCost,
              batches: [...(existingItem.batches || []), newBatch]  // Add batch to local state
            };

            // Update stock totals in Firebase
            console.log('Updating existing stock:', existingItem.id, 'newQty:', newQuantity, 'avgCost:', newAverageCost);
            await updateStock(existingItem.id, updatedItem);

            // Create batch record in stock_batches collection
            console.log('Creating batch for existing stock:', existingItem.id);
            await api.addStockBatch(existingItem.id, {
              date: invoiceData.invoiceDate,
              quantity: item.quantity,
              unitCost: item.unitCost,
              invoiceNumber: invoiceData.invoiceNumber
            }, currentUser.uid);
          }
        }
      }

      alert(`Invoice saved successfully! ${invoiceData.items.length} items processed.`);
    } catch (error) {
      console.error('Error saving invoice:', error);
      alert('Error saving invoice: ' + error.message);
    }
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const filteredStock = stock.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.partNumber && item.partNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalValue = stock.reduce((sum, item) => 
    sum + (item.totalQuantity * item.averageCost), 0
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Stock Management</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={() => setShowInvoice(true)}>
            <FileText size={20} /> New Purchase Invoice
          </button>
          <button className="btn btn-secondary" onClick={() => setIsAdding(true)}>
            <Plus size={20} /> Quick Add
          </button>
        </div>
      </div>

      <div className="stats-bar">
        <div className="stat-box">
          <h3>Total Items</h3>
          <p className="stat-value">{stock.length}</p>
        </div>
        <div className="stat-box">
          <h3>Total Units</h3>
          <p className="stat-value">{stock.reduce((sum, item) => sum + item.totalQuantity, 0)}</p>
        </div>
        <div className="stat-box">
          <h3>Total Value</h3>
          <p className="stat-value">{getCurrencySymbol()}{totalValue.toFixed(2)}</p>
        </div>
      </div>

      {showInvoice && (
        <PurchaseInvoice
          onClose={() => setShowInvoice(false)}
          onSave={handleInvoiceSave}
          stock={stock}
          suppliers={suppliers}
          currency={currency}
        />
      )}

      {isAdding && (
        <div className="modal-overlay" onClick={() => !editingId && resetForm()}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingId !== null ? 'Add Stock Purchase' : 'Add New Stock Item'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={editingId !== null}
                  />
                </div>
                <div className="form-group">
                  <label>Part Number</label>
                  <input
                    type="text"
                    value={formData.partNumber}
                    onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                    disabled={editingId !== null}
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    disabled={editingId !== null}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Purchase Date *</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity Purchased *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unit Cost ({getCurrencySymbol()}) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unitCost}
                    onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Supplier</label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    disabled={editingId !== null}
                  >
                    <option value="">No Supplier</option>
                    {suppliers && suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                    disabled={editingId !== null}
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingId !== null ? 'Add Purchase' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="search-bar">
        <Search size={20} />
        <input
          type="text"
          placeholder="Search stock items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Part Number</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Total Qty</th>
              <th>Avg Cost</th>
              <th>Total Value</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStock.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem' }}>
                  {searchTerm ? 'No items match your search' : 'No stock items yet. Add your first item to get started!'}
                </td>
              </tr>
            ) : (
              filteredStock.map(item => (
                <React.Fragment key={item.id}>
                  <tr className={item.totalQuantity < 5 ? 'low-stock' : ''}>
                    <td>
                      <button 
                        className="expand-btn" 
                        onClick={() => toggleExpand(item.id)}
                        title="View purchase history"
                      >
                        {expandedItems[item.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </td>
                    <td>
                      <strong>{item.name}</strong>
                      {item.description && <div className="item-description">{item.description}</div>}
                    </td>
                    <td>{item.partNumber || '-'}</td>
                    <td><span className="badge">{item.category}</span></td>
                    <td>
                      {item.supplierId && suppliers ?
                        suppliers.find(s => s.id === item.supplierId)?.name || '-'
                        : '-'}
                    </td>
                    <td>
                      {item.totalQuantity}
                      {item.totalQuantity < 5 && <span className="warning-badge">Low</span>}
                    </td>
                    <td>{getCurrencySymbol()}{item.averageCost.toFixed(2)}</td>
                    <td>{getCurrencySymbol()}{(item.totalQuantity * item.averageCost).toFixed(2)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="icon-btn" onClick={() => handleEdit(item)} title="Add Purchase">
                          <Plus size={16} />
                        </button>
                        <button className="icon-btn danger" onClick={() => handleDelete(item.id)} title="Delete">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedItems[item.id] && (
                    <tr className="batch-history-row">
                      <td colSpan="9">
                        <div className="batch-history">
                          <h4><History size={16} /> Transaction History</h4>
                          
                          {/* Purchase History */}
                          <div className="history-section">
                            <h5>Purchases (Last 10)</h5>
                            <table className="batch-table">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Type</th>
                                  <th>Quantity</th>
                                  <th>Unit Cost</th>
                                  <th>Total</th>
                                  <th>Reference</th>
                                </tr>
                              </thead>
                              <tbody>
                                {item.batches.slice(-10).reverse().map((batch, index) => (
                                  <tr key={batch.batchId || index} className="purchase-row">
                                    <td>{new Date(batch.date).toLocaleDateString()}</td>
                                    <td><span className="transaction-badge purchase">Purchase</span></td>
                                    <td>+{batch.quantity}</td>
                                    <td>{getCurrencySymbol()}{batch.unitCost.toFixed(2)}</td>
                                    <td>{getCurrencySymbol()}{(batch.quantity * batch.unitCost).toFixed(2)}</td>
                                    <td>{batch.invoiceNumber || '-'}</td>
                                  </tr>
                                ))}
                                {(!item.batches || item.batches.length === 0) && (
                                  <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '1rem', color: '#64748b' }}>
                                      No purchase history
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Usage History */}
                          {item.usageHistory && item.usageHistory.length > 0 && (
                            <div className="history-section">
                              <h5>Usage (Last 10)</h5>
                              <table className="batch-table">
                                <thead>
                                  <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th>Quantity</th>
                                    <th>Cost</th>
                                    <th>Job Card</th>
                                    <th>Asset</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {item.usageHistory.slice(-10).reverse().map((usage, index) => (
                                    <tr key={index} className="usage-row">
                                      <td>{new Date(usage.date).toLocaleDateString()}</td>
                                      <td><span className="transaction-badge usage">Used</span></td>
                                      <td>-{usage.quantity}</td>
                                      <td>{getCurrencySymbol()}{usage.cost.toFixed(2)}</td>
                                      <td>{usage.jobCardTitle}</td>
                                      <td>{usage.assetName || '-'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Stock;
