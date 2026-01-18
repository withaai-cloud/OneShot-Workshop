import React from 'react';
import { Globe, Info, Package } from 'lucide-react';

function Settings({ currency, setCurrency, inventoryMethod, setInventoryMethod }) {
  const currencies = [
    { code: 'ZAR', name: 'South African Rand (R)', symbol: 'R' },
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' }
  ];

  const handleCurrencyChange = (e) => {
    setCurrency(e.target.value);
  };

  const handleInventoryMethodChange = (e) => {
    if (window.confirm('Changing the inventory method will affect how costs are calculated on future job cards. Continue?')) {
      setInventoryMethod(e.target.value);
    }
  };

  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
      if (window.confirm('This will delete all stock, job cards, and assets. Are you absolutely sure?')) {
        localStorage.clear();
        window.location.reload();
      }
    }
  };

  const exportData = () => {
    const data = {
      stock: localStorage.getItem('workshopStock'),
      jobCards: localStorage.getItem('workshopJobCards'),
      assets: localStorage.getItem('workshopAssets'),
      suppliers: localStorage.getItem('workshopSuppliers'),
      currency: localStorage.getItem('workshopCurrency'),
      inventoryMethod: localStorage.getItem('workshopInventoryMethod'),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        if (window.confirm('This will replace all current data. Continue?')) {
          if (data.stock) localStorage.setItem('workshopStock', data.stock);
          if (data.jobCards) localStorage.setItem('workshopJobCards', data.jobCards);
          if (data.assets) localStorage.setItem('workshopAssets', data.assets);
          if (data.suppliers) localStorage.setItem('workshopSuppliers', data.suppliers);
          if (data.currency) localStorage.setItem('workshopCurrency', data.currency);
          if (data.inventoryMethod) localStorage.setItem('workshopInventoryMethod', data.inventoryMethod);
          
          alert('Data imported successfully! The page will now reload.');
          window.location.reload();
        }
      } catch (error) {
        alert('Error importing data. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <div className="section-header">
            <Globe size={24} />
            <h3>Currency Settings</h3>
          </div>
          <div className="form-group">
            <label>Select Currency</label>
            <select value={currency} onChange={handleCurrencyChange} className="currency-select">
              {currencies.map(curr => (
                <option key={curr.code} value={curr.code}>
                  {curr.name}
                </option>
              ))}
            </select>
            <p className="helper-text">
              This will change the currency symbol displayed throughout the application.
            </p>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Package size={24} />
            <h3>Inventory Costing Method</h3>
          </div>
          <div className="form-group">
            <label>Costing Method</label>
            <select value={inventoryMethod} onChange={handleInventoryMethodChange} className="currency-select">
              <option value="FIFO">FIFO (First In, First Out)</option>
              <option value="WEIGHTED_AVERAGE">Weighted Average</option>
            </select>
            <p className="helper-text">
              <strong>FIFO:</strong> Uses the cost of the oldest stock first when items are used in job cards.
            </p>
            <p className="helper-text">
              <strong>Weighted Average:</strong> Uses the average cost across all purchase batches.
            </p>
            <div className="inventory-method-info">
              <h4>Current Method: {inventoryMethod === 'FIFO' ? 'FIFO (First In, First Out)' : 'Weighted Average'}</h4>
              {inventoryMethod === 'FIFO' ? (
                <p>
                  When stock is used, the system will deduct from the oldest purchases first. 
                  This method matches the actual physical flow of goods and is commonly used for 
                  perishable items or when older stock should be used first.
                </p>
              ) : (
                <p>
                  When stock is used, the system will calculate an average cost across all purchase batches.
                  This method smooths out price fluctuations and is simpler for accounting purposes.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <Info size={24} />
            <h3>Data Management</h3>
          </div>
          
          <div className="data-management-actions">
            <div className="action-item">
              <div>
                <h4>Export Data</h4>
                <p>Download a backup of all your workshop data as JSON file.</p>
              </div>
              <button className="btn btn-secondary" onClick={exportData}>
                Export Backup
              </button>
            </div>

            <div className="action-item">
              <div>
                <h4>Import Data</h4>
                <p>Restore data from a previously exported backup file.</p>
              </div>
              <label className="btn btn-secondary" htmlFor="import-file">
                Import Backup
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: 'none' }}
              />
            </div>

            <div className="action-item danger-zone">
              <div>
                <h4>Clear All Data</h4>
                <p>Permanently delete all stock, job cards, and assets. This cannot be undone!</p>
              </div>
              <button className="btn btn-danger" onClick={clearAllData}>
                Clear All Data
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h3>About</h3>
          </div>
          <div className="about-info">
            <h4>OneShot Workshop Manager v2.0</h4>
            <p>
              A comprehensive web application for managing workshop expenses, stock inventory, and asset maintenance tracking for OneShot Workshop.
            </p>
            <p>
              <strong>Features:</strong>
            </p>
            <ul>
              <li>Stock management with batch tracking and multiple costing methods</li>
              <li>FIFO and Weighted Average inventory valuation</li>
              <li>Job card creation and management</li>
              <li>Asset expense tracking for vehicles, trailers, and implements</li>
              <li>Supplier management</li>
              <li>Comprehensive reporting and analytics</li>
              <li>Multi-currency support</li>
              <li>Data export and backup capabilities</li>
            </ul>
            <p className="helper-text">
              All data is stored locally in your browser. Make sure to export backups regularly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;