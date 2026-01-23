import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import * as api from './lib/firebaseApi';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);

  // Data state
  const [stock, setStock] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [assets, setAssets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currency, setCurrency] = useState('ZAR');
  const [inventoryMethod, setInventoryMethod] = useState('FIFO');

  // Load all user data from Supabase
  const loadUserData = useCallback(async (userId) => {
    setDataLoading(true);
    setError(null);
    try {
      const data = await api.loadAllUserData(userId);

      setStock(data.stock || []);
      setJobCards(data.jobCards || []);
      setAssets(data.assets || []);
      setSuppliers(data.suppliers || []);
      setCurrency(data.settings?.currency || 'ZAR');
      setInventoryMethod(data.settings?.inventory_method || 'FIFO');
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load data. Please refresh the page.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    // Listen for auth state changes (Firebase)
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        await loadUserData(user.uid);
      } else {
        // User is signed out
        setCurrentUser(null);
        setStock([]);
        setJobCards([]);
        setAssets([]);
        setSuppliers([]);
        setCurrency('ZAR');
        setInventoryMethod('FIFO');
      }
      setIsLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [loadUserData]);

  // Auth functions
  const handleLogin = async (user) => {
    setCurrentUser(user);
    await loadUserData(user.uid);
  };

  const handleLogout = async () => {
    try {
      await api.signOut();
      setCurrentUser(null);
      setStock([]);
      setJobCards([]);
      setAssets([]);
      setSuppliers([]);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Stock functions - FIXED: Use createStock instead of addStock
  const addStock = async (item) => {
    try {
      const newItem = await api.createStock(item, currentUser.uid);
      setStock(prev => [...prev, newItem]);
      return newItem;
    } catch (err) {
      console.error('Error adding stock:', err);
      throw err;
    }
  };

  const updateStock = async (id, updatedItem) => {
    try {
      await api.updateStock(id, updatedItem);
      setStock(prev => prev.map(item => item.id === id ? { ...updatedItem, id } : item));
    } catch (err) {
      console.error('Error updating stock:', err);
      throw err;
    }
  };

  const deleteStock = async (id) => {
    try {
      await api.deleteStock(id);
      setStock(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Error deleting stock:', err);
      throw err;
    }
  };

  // Job Card functions - FIXED: Use createJobCard instead of addJobCard
  const addJobCard = async (jobCard) => {
    try {
      const newJobCard = await api.createJobCard(jobCard, currentUser.uid);
      setJobCards(prev => [newJobCard, ...prev]);
      return newJobCard;
    } catch (err) {
      console.error('Error adding job card:', err);
      throw err;
    }
  };

  const updateJobCard = async (id, updatedJobCard) => {
    try {
      const updated = await api.updateJobCard(id, updatedJobCard);
      setJobCards(prev => prev.map(jc => jc.id === id ? updated : jc));
      return updated;
    } catch (err) {
      console.error('Error updating job card:', err);
      throw err;
    }
  };

  const deleteJobCard = async (id) => {
    try {
      // Get the job card to check if we need to restore stock
      const jobCard = jobCards.find(jc => jc.id === id);

      await api.deleteJobCard(id);
      setJobCards(prev => prev.filter(jc => jc.id !== id));

      // If the job card was completed, reload stock to get updated quantities
      if (jobCard && jobCard.status === 'completed' && jobCard.items) {
        const updatedStock = await api.fetchStock(currentUser.uid);
        setStock(updatedStock);
      }
    } catch (err) {
      console.error('Error deleting job card:', err);
      throw err;
    }
  };

  // Asset functions - FIXED: Use createAsset instead of addAsset
  const addAsset = async (asset) => {
    try {
      const newAsset = await api.createAsset(asset, currentUser.uid);
      setAssets(prev => [...prev, newAsset]);
      return newAsset;
    } catch (err) {
      console.error('Error adding asset:', err);
      throw err;
    }
  };

  const updateAsset = async (id, updatedAsset) => {
    try {
      const updated = await api.updateAsset(id, updatedAsset);
      setAssets(prev => prev.map(asset => asset.id === id ? updated : asset));
      return updated;
    } catch (err) {
      console.error('Error updating asset:', err);
      throw err;
    }
  };

  const deleteAsset = async (id) => {
    try {
      await api.deleteAsset(id);
      setAssets(prev => prev.filter(asset => asset.id !== id));
    } catch (err) {
      console.error('Error deleting asset:', err);
      throw err;
    }
  };

  // Supplier functions - FIXED: Use createSupplier instead of addSupplier
  const addSupplier = async (supplier) => {
    try {
      const newSupplier = await api.createSupplier(supplier, currentUser.uid);
      setSuppliers(prev => [...prev, newSupplier]);
      return newSupplier;
    } catch (err) {
      console.error('Error adding supplier:', err);
      throw err;
    }
  };

  const updateSupplier = async (id, updatedSupplier) => {
    try {
      const updated = await api.updateSupplier(id, updatedSupplier);
      setSuppliers(prev => prev.map(supplier => supplier.id === id ? updated : supplier));
      return updated;
    } catch (err) {
      console.error('Error updating supplier:', err);
      throw err;
    }
  };

  const deleteSupplier = async (id) => {
    try {
      await api.deleteSupplier(id);
      setSuppliers(prev => prev.filter(supplier => supplier.id !== id));
      // Update stock items that referenced this supplier
      setStock(prev => prev.map(item =>
        item.supplierId === id ? { ...item, supplierId: null } : item
      ));
    } catch (err) {
      console.error('Error deleting supplier:', err);
      throw err;
    }
  };

  // Settings functions
  const handleSetCurrency = async (newCurrency) => {
    try {
      await api.updateSettings(currentUser.uid, { currency: newCurrency, inventory_method: inventoryMethod });
      setCurrency(newCurrency);
    } catch (err) {
      console.error('Error updating currency:', err);
      throw err;
    }
  };

  const handleSetInventoryMethod = async (newMethod) => {
    try {
      await api.updateSettings(currentUser.uid, { currency, inventory_method: newMethod });
      setInventoryMethod(newMethod);
    } catch (err) {
      console.error('Error updating inventory method:', err);
      throw err;
    }
  };

  // Refresh data function (for manual refresh)
  const refreshData = async () => {
    if (currentUser) {
      await loadUserData(currentUser.uid);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <img src={process.env.PUBLIC_URL + "/header.png"} alt="OneShot Workshop" style={{ maxWidth: '300px' }} />
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {error && (
          <div className="global-error">
            {error}
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={
            currentUser ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          } />
          <Route path="/register" element={
            currentUser ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />
          } />

          {/* Protected routes */}
          <Route path="/dashboard/*" element={
            currentUser ? (
              <Dashboard
                stock={stock}
                addStock={addStock}
                updateStock={updateStock}
                deleteStock={deleteStock}
                jobCards={jobCards}
                addJobCard={addJobCard}
                updateJobCard={updateJobCard}
                deleteJobCard={deleteJobCard}
                assets={assets}
                addAsset={addAsset}
                updateAsset={updateAsset}
                deleteAsset={deleteAsset}
                suppliers={suppliers}
                addSupplier={addSupplier}
                updateSupplier={updateSupplier}
                deleteSupplier={deleteSupplier}
                currency={currency}
                setCurrency={handleSetCurrency}
                inventoryMethod={inventoryMethod}
                setInventoryMethod={handleSetInventoryMethod}
                currentUser={currentUser}
                onLogout={handleLogout}
                refreshData={refreshData}
                dataLoading={dataLoading}
              />
            ) : (
              <Navigate to="/login" />
            )
          } />

          {/* Redirect root to login or dashboard */}
          <Route path="/" element={
            <Navigate to={currentUser ? "/dashboard" : "/login"} />
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;