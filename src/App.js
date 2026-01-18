import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stock, setStock] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [assets, setAssets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currency, setCurrency] = useState('ZAR');
  const [inventoryMethod, setInventoryMethod] = useState('FIFO');
  const [nextStockId, setNextStockId] = useState(1);
  const [nextJobCardId, setNextJobCardId] = useState(1);
  const [nextAssetId, setNextAssetId] = useState(1);
  const [nextSupplierId, setNextSupplierId] = useState(1);

  // Check for logged in user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedStock = localStorage.getItem('workshopStock');
    const savedJobCards = localStorage.getItem('workshopJobCards');
    const savedAssets = localStorage.getItem('workshopAssets');
    const savedSuppliers = localStorage.getItem('workshopSuppliers');
    const savedCurrency = localStorage.getItem('workshopCurrency');
    const savedInventoryMethod = localStorage.getItem('workshopInventoryMethod');
    const savedNextStockId = localStorage.getItem('nextStockId');
    const savedNextJobCardId = localStorage.getItem('nextJobCardId');
    const savedNextAssetId = localStorage.getItem('nextAssetId');
    const savedNextSupplierId = localStorage.getItem('nextSupplierId');

    if (savedStock) setStock(JSON.parse(savedStock));
    if (savedJobCards) setJobCards(JSON.parse(savedJobCards));
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
    if (savedCurrency) setCurrency(savedCurrency);
    if (savedInventoryMethod) setInventoryMethod(savedInventoryMethod);
    if (savedNextStockId) setNextStockId(parseInt(savedNextStockId));
    if (savedNextJobCardId) setNextJobCardId(parseInt(savedNextJobCardId));
    if (savedNextAssetId) setNextAssetId(parseInt(savedNextAssetId));
    if (savedNextSupplierId) setNextSupplierId(parseInt(savedNextSupplierId));
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('workshopStock', JSON.stringify(stock));
  }, [stock]);

  useEffect(() => {
    localStorage.setItem('workshopJobCards', JSON.stringify(jobCards));
  }, [jobCards]);

  useEffect(() => {
    localStorage.setItem('workshopAssets', JSON.stringify(assets));
  }, [assets]);

  useEffect(() => {
    localStorage.setItem('workshopSuppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('workshopCurrency', currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem('workshopInventoryMethod', inventoryMethod);
  }, [inventoryMethod]);

  useEffect(() => {
    localStorage.setItem('nextStockId', nextStockId.toString());
  }, [nextStockId]);

  useEffect(() => {
    localStorage.setItem('nextJobCardId', nextJobCardId.toString());
  }, [nextJobCardId]);

  useEffect(() => {
    localStorage.setItem('nextAssetId', nextAssetId.toString());
  }, [nextAssetId]);

  useEffect(() => {
    localStorage.setItem('nextSupplierId', nextSupplierId.toString());
  }, [nextSupplierId]);

  // Auth functions
  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setCurrentUser(null);
  };

  // Stock functions
  const addStock = (item) => {
    const newItem = { ...item, id: nextStockId };
    setStock([...stock, newItem]);
    setNextStockId(nextStockId + 1);
  };

  const updateStock = (id, updatedItem) => {
    setStock(stock.map(item => item.id === id ? { ...updatedItem, id } : item));
  };

  const deleteStock = (id) => {
    setStock(stock.filter(item => item.id !== id));
  };

  // Job Card functions
  const addJobCard = (jobCard) => {
    const newJobCard = { ...jobCard, id: nextJobCardId };
    setJobCards([...jobCards, newJobCard]);
    setNextJobCardId(nextJobCardId + 1);
    return newJobCard;
  };

  const updateJobCard = (id, updatedJobCard) => {
    setJobCards(jobCards.map(jc => jc.id === id ? { ...updatedJobCard, id } : jc));
  };

  const deleteJobCard = (id) => {
    const jobCard = jobCards.find(jc => jc.id === id);
    if (jobCard && jobCard.status === 'completed' && jobCard.items) {
      jobCard.items.forEach(item => {
        const stockItem = stock.find(s => s.id === item.stockId);
        if (stockItem) {
          updateStock(stockItem.id, {
            ...stockItem,
            quantity: stockItem.quantity + item.quantity
          });
        }
      });
    }
    setJobCards(jobCards.filter(jc => jc.id !== id));
  };

  // Asset functions
  const addAsset = (asset) => {
    const newAsset = { ...asset, id: nextAssetId };
    setAssets([...assets, newAsset]);
    setNextAssetId(nextAssetId + 1);
  };

  const updateAsset = (id, updatedAsset) => {
    setAssets(assets.map(asset => asset.id === id ? { ...updatedAsset, id } : asset));
  };

  const deleteAsset = (id) => {
    setAssets(assets.filter(asset => asset.id !== id));
  };

  // Supplier functions
  const addSupplier = (supplier) => {
    const newSupplier = { ...supplier, id: nextSupplierId };
    setSuppliers([...suppliers, newSupplier]);
    setNextSupplierId(nextSupplierId + 1);
  };

  const updateSupplier = (id, updatedSupplier) => {
    setSuppliers(suppliers.map(supplier => supplier.id === id ? { ...updatedSupplier, id } : supplier));
  };

  const deleteSupplier = (id) => {
    setStock(stock.map(item => 
      item.supplierId === id ? { ...item, supplierId: null } : item
    ));
    setSuppliers(suppliers.filter(supplier => supplier.id !== id));
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
                setCurrency={setCurrency}
                inventoryMethod={inventoryMethod}
                setInventoryMethod={setInventoryMethod}
                currentUser={currentUser}
                onLogout={handleLogout}
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