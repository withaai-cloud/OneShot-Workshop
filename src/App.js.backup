import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Package, FileText, Truck, DollarSign, Settings, Home as HomeIcon, Building2 } from 'lucide-react';
import './App.css';
import Home from './components/Home';
import Stock from './components/Stock';
import JobCards from './components/JobCards';
import Assets from './components/Assets';
import Reports from './components/Reports';
import SettingsPage from './components/Settings';
import Suppliers from './components/Suppliers';
import Login from './components/Login';
import Register from './components/Register';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [stock, setStock] = useState([]);
  const [jobCards, setJobCards] = useState([]);
  const [assets, setAssets] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [currency, setCurrency] = useState('ZAR');
  const [nextStockId, setNextStockId] = useState(1);
  const [nextJobCardId, setNextJobCardId] = useState(1);
  const [nextAssetId, setNextAssetId] = useState(1);
  const [nextSupplierId, setNextSupplierId] = useState(1);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('workshopCurrentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }

    const savedStock = localStorage.getItem('workshopStock');
    const savedJobCards = localStorage.getItem('workshopJobCards');
    const savedAssets = localStorage.getItem('workshopAssets');
    const savedSuppliers = localStorage.getItem('workshopSuppliers');
    const savedCurrency = localStorage.getItem('workshopCurrency');
    const savedNextStockId = localStorage.getItem('nextStockId');
    const savedNextJobCardId = localStorage.getItem('nextJobCardId');
    const savedNextAssetId = localStorage.getItem('nextAssetId');
    const savedNextSupplierId = localStorage.getItem('nextSupplierId');

    if (savedStock) setStock(JSON.parse(savedStock));
    if (savedJobCards) setJobCards(JSON.parse(savedJobCards));
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedSuppliers) setSuppliers(JSON.parse(savedSuppliers));
    if (savedCurrency) setCurrency(savedCurrency);
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
    // When deleting a job card, restore stock quantities
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

  const addSupplier = (supplier) => {
    const newSupplier = { ...supplier, id: nextSupplierId };
    setSuppliers([...suppliers, newSupplier]);
    setNextSupplierId(nextSupplierId + 1);
  };

  const updateSupplier = (id, updatedSupplier) => {
    setSuppliers(suppliers.map(supplier => supplier.id === id ? { ...updatedSupplier, id } : supplier));
  };

  const deleteSupplier = (id) => {
    // Remove supplier reference from stock items
    setStock(stock.map(item => 
      item.supplierId === id ? { ...item, supplierId: null } : item
    ));
    setSuppliers(suppliers.filter(supplier => supplier.id !== id));
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('workshopCurrentUser');
    setCurrentUser(null);
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Register onLogin={handleLogin} />} />
          <Route path="/*" element={
            currentUser ? (
              <>
                <Navigation currentUser={currentUser} onLogout={handleLogout} />
                <main className="main-content">
                  <Routes>
                    <Route path="/dashboard" element={<Home />} />
                    <Route path="/stock" element={
              <Stock 
                stock={stock} 
                addStock={addStock} 
                updateStock={updateStock}
                deleteStock={deleteStock}
                currency={currency}
                suppliers={suppliers}
              />
            } />
            <Route path="/job-cards" element={
              <JobCards 
                jobCards={jobCards}
                addJobCard={addJobCard}
                updateJobCard={updateJobCard}
                deleteJobCard={deleteJobCard}
                stock={stock}
                updateStock={updateStock}
                assets={assets}
                currency={currency}
              />
            } />
            <Route path="/assets" element={
              <Assets 
                assets={assets}
                addAsset={addAsset}
                updateAsset={updateAsset}
                deleteAsset={deleteAsset}
                jobCards={jobCards}
                currency={currency}
              />
            } />
            <Route path="/suppliers" element={
              <Suppliers 
                suppliers={suppliers}
                addSupplier={addSupplier}
                updateSupplier={updateSupplier}
                deleteSupplier={deleteSupplier}
                stock={stock}
                currency={currency}
              />
            } />
            <Route path="/reports" element={
              <Reports 
                stock={stock}
                jobCards={jobCards}
                assets={assets}
                currency={currency}
              />
            } />
            <Route path="/settings" element={
              <SettingsPage 
                currency={currency}
                setCurrency={setCurrency}
              />
            } />
          </Routes>
        </main>
      </>
    ) : (
      <Routes>
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    )
  } />
        </Routes>
      </div>
    </Router>
  );
}

function Navigation({ currentUser, onLogout }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Home' },
    { path: '/stock', icon: Package, label: 'Stock' },
    { path: '/job-cards', icon: FileText, label: 'Job Cards' },
    { path: '/assets', icon: Truck, label: 'Assets' },
    { path: '/suppliers', icon: Building2, label: 'Suppliers' },
    { path: '/reports', icon: DollarSign, label: 'Reports' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-header">
        <img src="/header.png" alt="OneShot Workshop" className="nav-logo" />
      </div>
      <ul className="nav-list">
        {navItems.map(item => (
          <li key={item.path}>
            <Link 
              to={item.path} 
              className={location.pathname === item.path ? 'active' : ''}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="nav-footer">
        <div className="user-profile">
          <div className="user-avatar">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-info">
            <p className="user-name">{currentUser?.name || 'User'}</p>
            <p className="user-email">{currentUser?.email || ''}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default App;
