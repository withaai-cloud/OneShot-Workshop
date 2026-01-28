import React, { useState } from 'react';
import { Plus, Trash2, Save, X } from 'lucide-react';

function PurchaseInvoice({ onClose, onSave, stock, suppliers, currency, categories }) {
  const [invoiceData, setInvoiceData] = useState({
    supplierId: '',
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    notes: '',
    items: []
  });

  // Use categories from props, fallback to defaults if not provided
  const invoiceCategories = categories || ['Parts', 'Fluids', 'Filters', 'Consumables', 'Tools', 'Other'];

  const getCurrencySymbol = () => {
    const symbols = {
      'ZAR': 'R',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  };

  const addInvoiceItem = () => {
    setInvoiceData({
      ...invoiceData,
      items: [...invoiceData.items, {
        stockId: 'new',
        name: '',
        partNumber: '',
        category: 'Parts',
        description: '',
        quantity: 0,
        unitCost: 0
      }]
    });
  };

  const updateInvoiceItem = (index, field, value) => {
    const newItems = [...invoiceData.items];
    
    // If stockId changed to existing item, populate fields
    if (field === 'stockId' && value !== 'new') {
      const existingItem = stock.find(s => s.id === value); // ✅ FIXED: Removed parseInt
      if (existingItem) {
        newItems[index] = {
          ...newItems[index],
          stockId: value,
          name: existingItem.name,
          partNumber: existingItem.partNumber || '',
          category: existingItem.category,
          description: existingItem.description || ''
        };
      }
    } else {
      newItems[index][field] = value;
    }
    
    setInvoiceData({ ...invoiceData, items: newItems });
  };

  const removeInvoiceItem = (index) => {
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.filter((_, i) => i !== index)
    });
  };

  const calculateTotal = () => {
    return invoiceData.items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unitCost)); // ✅ Added parseFloat for safety
    }, 0);
  };

  const handleSave = () => {
    // Validation
    if (!invoiceData.supplierId) {
      alert('Please select a supplier');
      return;
    }

    if (invoiceData.items.length === 0) {
      alert('Please add at least one item');
      return;
    }

    // Validate all items
    for (const item of invoiceData.items) {
      if (!item.name) {
        alert('Please fill in all item names');
        return;
      }
      if (item.quantity <= 0) {
        alert('Please enter valid quantities for all items');
        return;
      }
      if (item.unitCost <= 0) {
        alert('Please enter valid costs for all items');
        return;
      }
    }

    // Process the invoice
    const purchaseInvoice = {
      ...invoiceData,
      invoiceTotal: calculateTotal(),
      createdAt: new Date().toISOString()
    };

    onSave(purchaseInvoice);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-extra-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>New Purchase Invoice</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="invoice-form">
          {/* Invoice Header */}
          <div className="invoice-header-section">
            <div className="form-grid">
              <div className="form-group">
                <label>Supplier *</label>
                <select
                  value={invoiceData.supplierId}
                  onChange={(e) => setInvoiceData({ ...invoiceData, supplierId: e.target.value })}
                  required
                >
                  <option value="">Select Supplier</option>
                  {suppliers && suppliers.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  placeholder="INV-001 (optional)"
                  value={invoiceData.invoiceNumber}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Invoice Date *</label>
                <input
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={(e) => setInvoiceData({ ...invoiceData, invoiceDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group full-width">
                <label>Notes</label>
                <input
                  type="text"
                  placeholder="Additional notes (optional)"
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData({ ...invoiceData, notes: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="invoice-items-section">
            <div className="section-header">
              <h4>Invoice Items</h4>
              <button type="button" className="btn btn-sm btn-secondary" onClick={addInvoiceItem}>
                <Plus size={16} /> Add Item
              </button>
            </div>

            {invoiceData.items.length === 0 ? (
              <div className="empty-invoice">
                <p>No items added yet. Click "Add Item" to start.</p>
              </div>
            ) : (
              <div className="invoice-items-list">
                <table className="invoice-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '20%' }}>Item</th>
                      <th style={{ width: '12%' }}>Part No.</th>
                      <th style={{ width: '12%' }}>Category</th>
                      <th style={{ width: '10%' }}>Qty</th>
                      <th style={{ width: '12%' }}>Unit Cost</th>
                      <th style={{ width: '12%' }}>Total</th>
                      <th style={{ width: '17%' }}>Description</th>
                      <th style={{ width: '5%' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoiceData.items.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>
                          <select
                            value={item.stockId}
                            onChange={(e) => updateInvoiceItem(index, 'stockId', e.target.value)}
                            className="invoice-select"
                          >
                            <option value="new">+ New Item</option>
                            {stock.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                          {item.stockId === 'new' && (
                            <input
                              type="text"
                              placeholder="Item name"
                              value={item.name}
                              onChange={(e) => updateInvoiceItem(index, 'name', e.target.value)}
                              className="invoice-input"
                              required
                            />
                          )}
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Part no."
                            value={item.partNumber}
                            onChange={(e) => updateInvoiceItem(index, 'partNumber', e.target.value)}
                            className="invoice-input"
                            disabled={item.stockId !== 'new'}
                          />
                        </td>
                        <td>
                          <select
                            value={item.category}
                            onChange={(e) => updateInvoiceItem(index, 'category', e.target.value)}
                            className="invoice-select"
                            disabled={item.stockId !== 'new'}
                          >
                            {invoiceCategories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="0"
                            value={item.quantity || ''}
                            onChange={(e) => updateInvoiceItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="invoice-input"
                            required
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            value={item.unitCost || ''}
                            onChange={(e) => updateInvoiceItem(index, 'unitCost', parseFloat(e.target.value) || 0)}
                            className="invoice-input"
                            required
                          />
                        </td>
                        <td className="invoice-total-cell">
                          {getCurrencySymbol()}{((parseFloat(item.quantity) || 0) * (parseFloat(item.unitCost) || 0)).toFixed(2)}
                        </td>
                        <td>
                          <input
                            type="text"
                            placeholder="Notes"
                            value={item.description}
                            onChange={(e) => updateInvoiceItem(index, 'description', e.target.value)}
                            className="invoice-input"
                            disabled={item.stockId !== 'new'}
                          />
                        </td>
                        <td>
                          <button
                            type="button"
                            className="icon-btn danger"
                            onClick={() => removeInvoiceItem(index)}
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Invoice Total */}
          <div className="invoice-total-section">
            <div className="invoice-total-label">Invoice Total:</div>
            <div className="invoice-total-amount">{getCurrencySymbol()}{calculateTotal().toFixed(2)}</div>
          </div>

          {/* Actions */}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              <X size={16} /> Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              <Save size={16} /> Save Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseInvoice;