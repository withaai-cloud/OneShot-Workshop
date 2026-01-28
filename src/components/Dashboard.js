import React from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Package, FileText, Truck, DollarSign, Settings, Home as HomeIcon, Building2, LogOut, RefreshCw } from 'lucide-react';
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
  categories, setCategories,
  currentUser,
  onLogout,
  refreshData,
  dataLoading
}) {

  return (
    <div className="dashboard-container">
      <Navigation
        currentUser={currentUser}
        onLogout={onLogout}
        refreshData={refreshData}
        dataLoading={dataLoading}
      />
      <main className="main-content">
        {dataLoading && (
          <div className="data-loading-overlay">
            <RefreshCw size={24} className="spinner" />
            <span>Loading data...</span>
          </div>
        )}
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
              currentUser={currentUser}
              refreshData={refreshData}
              inventoryMethod={inventoryMethod}
              categories={categories}
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
              currentUser={currentUser}
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
              categories={categories}
              setCategories={setCategories}
              stock={stock}
              currentUser={currentUser}
            />
          } />
        </Routes>
      </main>
    </div>
  );
}

function Navigation({ currentUser, onLogout, refreshData, dataLoading }) {
  const location = useLocation();

  // Get user display info from Firebase user
  const userName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const workshopName = 'Workshop';

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
        <img src={process.env.PUBLIC_URL + "/header.png"} alt="OneShot Workshop" className="nav-logo" />
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
        {refreshData && (
          <button
            className="refresh-btn"
            onClick={refreshData}
            disabled={dataLoading}
            title="Refresh data"
          >
            <RefreshCw size={18} className={dataLoading ? 'spinner' : ''} />
          </button>
        )}
        <div className="user-info">
          <div className="user-avatar">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <p className="user-name">{userName}</p>
            <p className="user-workshop">{workshopName}</p>
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
