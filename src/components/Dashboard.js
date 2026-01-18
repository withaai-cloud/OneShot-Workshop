import React from 'react';
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, FileText, Truck, DollarSign, Settings, Home as HomeIcon, Building2, LogOut } from 'lucide-react';
import Home from './Home';
import Stock from './Stock';
import JobCards from './JobCards';
import Assets from './Assets';
import Suppliers from './Suppliers';
import Reports from './Reports';
import SettingsPage from './Settings';

function Dashboard({ 
  stock, addStock, updateStock, deleteStock,
  jobCards, addJobCard, updateJobCard, deleteJobCard,
  assets, addAsset, updateAsset, deleteAsset,
  suppliers, addSupplier, updateSupplier, deleteSupplier,
  currency, setCurrency,
  inventoryMethod, setInventoryMethod,
  currentUser,
  onLogout
}) {
  
  return (
    <div className="dashboard-container">
      <Navigation currentUser={currentUser} onLogout={onLogout} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
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
              inventoryMethod={inventoryMethod}
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
              inventoryMethod={inventoryMethod}
              setInventoryMethod={setInventoryMethod}
            />
          } />
        </Routes>
      </main>
    </div>
  );
}

function Navigation({ currentUser, onLogout }) {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', icon: HomeIcon, label: 'Home' },
    { path: '/dashboard/stock', icon: Package, label: 'Stock' },
    { path: '/dashboard/job-cards', icon: FileText, label: 'Job Cards' },
    { path: '/dashboard/assets', icon: Truck, label: 'Assets' },
    { path: '/dashboard/suppliers', icon: Building2, label: 'Suppliers' },
    { path: '/dashboard/reports', icon: DollarSign, label: 'Reports' },
    { path: '/dashboard/settings', icon: Settings, label: 'Settings' },
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
        <div className="user-info">
          <div className="user-avatar">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="user-details">
            <p className="user-name">{currentUser?.name || 'User'}</p>
            <p className="user-workshop">{currentUser?.workshopName || 'Workshop'}</p>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </nav>
  );
}

export default Dashboard;