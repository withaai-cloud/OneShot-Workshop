import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Welcome from './components/Welcome';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import { supabase } from './lib/supabase';
import * as api from './lib/api';
import * as cache from './lib/cache';

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

  // Sync with Supabase in background (doesn't block UI)
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
  }, []); // Empty deps - this function doesn't depend on state

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

    // No cache or force refresh - load from Supabase
    setDataLoading(true);
    setError(null);
    setLoadedFromCache(false);
    
    try {
      console.log('📡 Loading from Supabase...');
      const data = await api.loadAllUserData(userId);
      console.log('✅ Loaded from Supabase');

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
    const initAuth = async () => {
      console.log('Initializing auth...');
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Session result:', { session: !!session, error });

        if (error) {
          console.error('Session error:', error);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          console.log('User found:', session.user.id);
          setCurrentUser(session.user);
          await loadUserData(session.user.id);
        } else {
          console.log('No session found');
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      
      if (event === 'SIGNED_IN' && session?.user) {
        setCurrentUser(session.user);
        await loadUserData(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setStock([]);
        setJobCards([]);
        setAssets([]);
        setSuppliers([]);
        setCurrency('ZAR');
        setInventoryMethod('FIFO');
        cache.clearCache();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  // Auth functions
  const handleLogin = async (user) => {
    setCurrentUser(user);
    await loadUserData(user.id);
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
      const newItem = await api.createStock(item, currentUser.id);
      setStock(prev => [...prev, newItem]);
      cache.invalidateCache(); // Invalidate cache on change
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
      const newJobCard = await api.createJobCard(jobCard, currentUser.id);
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
      const jobCard = jobCards.find(jc => jc.id === id);

      await api.deleteJobCard(id);
      setJobCards(prev => prev.filter(jc => jc.id !== id));
      cache.invalidateCache();

      if (jobCard && jobCard.status === 'completed' && jobCard.items) {
        const updatedStock = await api.fetchStock(currentUser.id);
        setStock(updatedStock);
      }
    } catch (err) {
      console.error('Error deleting job card:', err);
      throw err;
    }
  };

  // Asset functions
  const addAsset = async (asset) => {
    try {
      const newAsset = await api.createAsset(asset, currentUser.id);
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
      const newSupplier = await api.createSupplier(supplier, currentUser.id);
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
      await api.updateSettings(currentUser.id, { currency: newCurrency, inventory_method: inventoryMethod });
      setCurrency(newCurrency);
      cache.invalidateCache();
    } catch (err) {
      console.error('Error updating currency:', err);
      throw err;
    }
  };

  const handleSetInventoryMethod = async (newMethod) => {
    try {
      await api.updateSettings(currentUser.id, { currency, inventory_method: newMethod });
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
      await loadUserData(currentUser.id, true); // Force refresh
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