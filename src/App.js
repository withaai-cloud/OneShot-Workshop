import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import * as api from './lib/firebaseApi';
import * as cache from './lib/cache';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadedFromCache, setLoadedFromCache] = useState(false);

  // Data state
  const [stock, setStock] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [assets, setAssets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currency, setCurrency] = useState('ZAR');
  const [inventoryMethod, setInventoryMethod] = useState('FIFO');

  // Sync with Firebase in background (doesn't block UI)
  const syncInBackground = useCallback(async (userId) => {
    try {
      console.log('🔄 Syncing in background...');
      const data = await api.loadAllUserData(userId);
      
      // Update state silently
      setStock(data.stock || []);
      setJobCards(data.jobCards || []);
      setAssets(data.assets || []);
      setSuppliers(data.suppliers || []);
      setCurrency(data.settings?.currency || 'ZAR');
      setInventoryMethod(data.settings?.inventory_method || 'FIFO');

      // Update cache
      cache.setCachedData(userId, data);
      console.log('✅ Background sync complete');
    } catch (err) {
      console.error('Background sync failed (non-critical):', err);
    }
  }, []);

  // Load all user data with caching
  const loadUserData = useCallback(async (userId, forceRefresh = false) => {
    console.log('Loading user data...', { userId, forceRefresh });
    
    // Try cache first (unless force refresh)
    if (!forceRefresh) {
      const cachedData = cache.getCachedData(userId);
      if (cachedData) {
        console.log('✅ Loaded from cache (instant)');
        setStock(cachedData.stock);
        setJobCards(cachedData.jobCards);
        setAssets(cachedData.assets);
        setSuppliers(cachedData.suppliers);
        setCurrency(cachedData.settings?.currency || 'ZAR');
        setInventoryMethod(cachedData.settings?.inventory_method || 'FIFO');
        setLoadedFromCache(true);
        
        // Sync in background (don't block UI)
        syncInBackground(userId);
        return;
      }
    }

    // No cache or force refresh - load from Firebase
    setDataLoading(true);
    setError(null);
    setLoadedFromCache(false);
    
    try {
      console.log('📡 Loading from Firebase...');
      const data = await api.loadAllUserData(userId);
      console.log('✅ Loaded from Firebase');

      setStock(data.stock || []);
      setJobCards(data.jobCards || []);
      setAssets(data.assets || []);
      setSuppliers(data.suppliers || []);
      setCurrency(data.settings?.currency || 'ZAR');
      setInventoryMethod(data.settings?.inventory_method || 'FIFO');

      // Save to cache
      cache.setCachedData(userId, data);
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load data: ' + err.message);
    } finally {
      setDataLoading(false);
    }
  }, [syncInBackground]);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = () => {
      console.log('Initializing auth...');
      
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        console.log('Auth state changed:', user ? 'User logged in' : 'No user');
        
        if (user) {
          setCurrentUser(user);
          await loadUserData(user.uid);
        } else {
          setCurrentUser(null);
          setStock([]);
          setJobCards([]);
          setAssets([]);
          setSuppliers([]);
          setCurrency('ZAR');
          setInventoryMethod('FIFO');
          cache.clearCache();
        }
        
        setIsLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = initAuth();
    return () => unsubscribe();
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
      cache.clearCache();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Stock functions
  const addStock = async (item) => {
    try {
      const newItem = await api.createStock(item, currentUser.uid);
      setStock(prev => [...prev, newItem]);
      cache.invalidateCache();
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
      cache.invalidateCache();
    } catch (err) {
      console.error('Error updating stock:', err);
      throw err;
    }
  };

  const deleteStock = async (id) => {
    try {
      await api.deleteStock(id);
      setStock(prev => prev.filter(item => item.id !== id));
      cache.invalidateCache();
    } catch (err) {
      console.error('Error deleting stock:', err);
      throw err;
    }
  };

  // Job Card functions
  const addJobCard = async (jobCard) => {
    try {
      const newJobCard = await api.createJobCard(jobCard, currentUser.uid);
      setJobCards(prev => [newJobCard, ...prev]);
      cache.invalidateCache();
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
      cache.invalidateCache();
      return updated;
    } catch (err) {
      console.error('Error updating job card:', err);
      throw err;
    }
  };

  const deleteJobCard = async (id) => {
    try {
      await api.deleteJobCard(id);
      setJobCards(prev => prev.filter(jc => jc.id !== id));
      cache.invalidateCache();
    } catch (err) {
      console.error('Error deleting job card:', err);
      throw err;
    }
  };

  // Asset functions
  const addAsset = async (asset) => {
    try {
      const newAsset = await api.createAsset(asset, currentUser.uid);
      setAssets(prev => [...prev, newAsset]);
      cache.invalidateCache();
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
      cache.invalidateCache();
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
      cache.invalidateCache();
    } catch (err) {
      console.error('Error deleting asset:', err);
      throw err;
    }
  };

  // Supplier functions
  const addSupplier = async (supplier) => {
    try {
      const newSupplier = await api.createSupplier(supplier, currentUser.uid);
      setSuppliers(prev => [...prev, newSupplier]);
      cache.invalidateCache();
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
      cache.invalidateCache();
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
      setStock(prev => prev.map(item =>
        item.supplierId === id ? { ...item, supplierId: null } : item
      ));
      cache.invalidateCache();
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
      cache.invalidateCache();
    } catch (err) {
      console.error('Error updating currency:', err);
      throw err;
    }
  };

  const handleSetInventoryMethod = async (newMethod) => {
    try {
      await api.updateSettings(currentUser.uid, { currency, inventory_method: newMethod });
      setInventoryMethod(newMethod);
      cache.invalidateCache();
    } catch (err) {
      console.error('Error updating inventory method:', err);
      throw err;
    }
  };

  // Refresh data function (for manual refresh)
  const refreshData = async () => {
    if (currentUser) {
      await loadUserData(currentUser.uid, true);
    }
  };

  if (isLoading) {
    return (
      <div className="loading-screen">
        <img src={process.env.PUBLIC_URL + "/header.png"} alt="OneShot Workshop" style={{ maxWidth: '300px' }} />
        <div className="spinner"></div>
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
        {loadedFromCache && !dataLoading && (
          <div className="cache-indicator" style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            background: '#10b981',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            ⚡ Loaded instantly from cache
          </div>
        )}
        <Routes>
          {/* Welcome/Landing Page */}
          <Route path="/" element={<Welcome />} />
          
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
        </Routes>
      </div>
    </Router>
  );
}

export default App;