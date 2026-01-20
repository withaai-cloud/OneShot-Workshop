import React, { useState } from 'react';
import { Globe, Info, Package, Loader } from 'lucide-react';
import * as api from '../lib/api';

function Settings({ currency, setCurrency, inventoryMethod, setInventoryMethod, currentUser }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currencies = [
    { code: 'ZAR', name: 'South African Rand (R)', symbol: 'R' },
    { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
    { code: 'EUR', name: 'Euro (€)', symbol: '€' },
    { code: 'GBP', name: 'British Pound (£)', symbol: '£' }
  ];

  const handleCurrencyChange = async (e) => {
    const newCurrency = e.target.value;
    setIsLoading(true);
    setError('');
    try {
      await setCurrency(newCurrency);
      setSuccess('Currency updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update currency. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInventoryMethodChange = async (e) => {
    const newMethod = e.target.value;
    if (window.confirm('Changing the inventory method will affect how costs are calculated on future job cards. Continue?')) {
      setIsLoading(true);
      setError('');
      try {
        await setInventoryMethod(newMethod);
        setSuccess('Inventory method updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError('Failed to update inventory method. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone!')) {
      if (window.confirm('This will delete all stock, job cards, assets, and suppliers. Are you absolutely sure?')) {
        setIsLoading(true);
        setError('');
        try {
          await api.clearAllUserData(currentUser.id);
          setSuccess('All data cleared successfully! The page will now reload.');
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          setError('Failed to clear data. Please try again.');
          setIsLoading(false);
        }
      }
    }
  };

  const exportData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await api.exportUserData(currentUser.id);
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `workshop-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
      setSuccess('Data exported successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to export data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const importData = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        if (window.confirm('This will replace all current data. Continue?')) {
          setIsLoading(true);
          setError('');
          await api.importUserData(currentUser.id, event.target.result);
          setSuccess('Data imported successfully! The page will now reload.');
          setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err) {
        setError('Error importing data. Please check the file format.');
        setIsLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Settings</h2>
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {success && (
        <div className="auth-success" style={{ marginBottom: '1rem' }}>
          {success}
        </div>
      )}

      <div className="settings-container">
        <div className="settings-section">
          <div className="section-header">
            <Globe size={24} />
            <h3>Currency Settings</h3>
          </div>
          <div className="form-group">
            <label>Select Currency</label>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              className="currency-select"
              disabled={isLoading}
            >
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
            <select
              value={inventoryMethod}
              onChange={handleInventoryMethodChange}
              className="currency-select"
              disabled={isLoading}
            >
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
              <button
                className="btn btn-secondary"
                onClick={exportData}
                disabled={isLoading}
              >
                {isLoading ? <Loader size={16} className="spinner" /> : 'Export Backup'}
              </button>
            </div>

            <div className="action-item">
              <div>
                <h4>Import Data</h4>
                <p>Restore data from a previously exported backup file.</p>
              </div>
              <label
                className={`btn btn-secondary ${isLoading ? 'disabled' : ''}`}
                htmlFor="import-file"
              >
                Import Backup
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={importData}
                style={{ display: 'none' }}
                disabled={isLoading}
              />
            </div>

            <div className="action-item danger-zone">
              <div>
                <h4>Clear All Data</h4>
                <p>Permanently delete all stock, job cards, assets, and suppliers. This cannot be undone!</p>
              </div>
              <button
                className="btn btn-danger"
                onClick={clearAllData}
                disabled={isLoading}
              >
                {isLoading ? <Loader size={16} className="spinner" /> : 'Clear All Data'}
              </button>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <div className="section-header">
            <h3>About</h3>
          </div>
          <div className="about-info">
            <h4>OneShot Workshop Manager v2.1</h4>
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
              <li>Cloud-based data storage with Supabase</li>
              <li>Secure user authentication</li>
              <li>Data export and backup capabilities</li>
            </ul>
            <p className="helper-text">
              Your data is securely stored in the cloud. You can access it from any device by logging in with your account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
