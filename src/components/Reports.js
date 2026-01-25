import React, { useState } from 'react';
import { Download, BarChart3, PieChart } from 'lucide-react';

function Reports({ stock, jobCards, assets, currency }) {
  const [reportType, setReportType] = useState('overview');

  const getCurrencySymbol = () => {
    const symbols = {
      'ZAR': 'R',
      'USD': '$',
      'EUR': '€',
      'GBP': '£'
    };
    return symbols[currency] || currency;
  };

  const getStockValue = () => {
    return stock.reduce((sum, item) => {
      // Use totalQuantity and averageCost if available (new system)
      if (item.totalQuantity !== undefined && item.averageCost !== undefined) {
        return sum + (item.totalQuantity * item.averageCost);
      }
      // Fallback to old system
      return sum + (item.quantity * item.unitCost);
    }, 0);
  };

  const getTotalExpenses = () => {
    return jobCards
      .filter(jc => jc.status === 'completed')
      .reduce((sum, jc) => {
        const itemsCost = jc.items ? jc.items.reduce((itemSum, item) => {
          // Use actualCost if available (new system)
          if (item.actualCost !== undefined) {
            return itemSum + item.actualCost;
          }
          // Fallback to old calculation
          const stockItem = stock.find(s => s.id === item.stockId);
          return itemSum + ((stockItem?.unitCost || stockItem?.averageCost || 0) * item.quantity);
        }, 0) : 0;
        return sum + itemsCost + (parseFloat(jc.laborCost) || 0);
      }, 0);
  };

  const getExpensesByAsset = () => {
    return assets.map(asset => {
      const assetJobCards = jobCards.filter(jc => jc.assetId === asset.id && jc.status === 'completed');
      const totalCost = assetJobCards.reduce((sum, jc) => {
        const itemsCost = jc.items ? jc.items.reduce((itemSum, item) => {
          // Use actualCost if available (new system)
          if (item.actualCost !== undefined) {
            return itemSum + item.actualCost;
          }
          // Fallback to old calculation
          const stockItem = stock.find(s => s.id === item.stockId);
          return itemSum + ((stockItem?.unitCost || stockItem?.averageCost || 0) * item.quantity);
        }, 0) : 0;
        return sum + itemsCost + (parseFloat(jc.laborCost) || 0);
      }, 0);

      return {
        asset,
        jobCardCount: assetJobCards.length,
        totalCost
      };
    }).sort((a, b) => b.totalCost - a.totalCost);
  };

  const getExpensesByCategory = () => {
    const categoryMap = {};

    jobCards
      .filter(jc => jc.status === 'completed')
      .forEach(jc => {
        if (jc.items) {
          jc.items.forEach(item => {
            const stockItem = stock.find(s => s.id === item.stockId);
            if (stockItem) {
              const category = stockItem.category;
              if (!categoryMap[category]) {
                categoryMap[category] = 0;
              }
              
              // Use actualCost if available (new system)
              if (item.actualCost !== undefined) {
                categoryMap[category] += item.actualCost;
              } else {
                // Fallback to old calculation
                const cost = stockItem.unitCost || stockItem.averageCost || 0;
                categoryMap[category] += cost * item.quantity;
              }
            }
          });
        }
        
        // Add labor as a category
        const laborCost = parseFloat(jc.laborCost) || 0;
        if (laborCost > 0) {
          if (!categoryMap['Labor']) {
            categoryMap['Labor'] = 0;
          }
          categoryMap['Labor'] += laborCost;
        }
      });
    
    return Object.entries(categoryMap)
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost);
  };

  const getLowStockItems = () => {
    return stock.filter(item => {
      // Use totalQuantity if available (new system)
      const qty = item.totalQuantity !== undefined ? item.totalQuantity : item.quantity;
      return qty < 5;
    }).sort((a, b) => {
      const qtyA = a.totalQuantity !== undefined ? a.totalQuantity : a.quantity;
      const qtyB = b.totalQuantity !== undefined ? b.totalQuantity : b.quantity;
      return qtyA - qtyB;
    });
  };

  const exportToCSV = () => {
    let csvContent = '';
    
    if (reportType === 'stock') {
      csvContent = 'Name,Part Number,Category,Quantity,Unit Cost,Total Value\n';
      stock.forEach(item => {
        const qty = item.totalQuantity !== undefined ? item.totalQuantity : item.quantity;
        const cost = item.averageCost !== undefined ? item.averageCost : item.unitCost;
        csvContent += `"${item.name}","${item.partNumber || ''}","${item.category}",${qty},${cost},${qty * cost}\n`;
      });
    } else if (reportType === 'expenses') {
      csvContent = 'Asset,Type,Job Cards,Total Expenses\n';
      getExpensesByAsset().forEach(({ asset, jobCardCount, totalCost }) => {
        csvContent += `"${asset.name}","${asset.type}",${jobCardCount},${totalCost.toFixed(2)}\n`;
      });
    } else if (reportType === 'categories') {
      csvContent = 'Category,Total Cost\n';
      getExpensesByCategory().forEach(({ category, cost }) => {
        csvContent += `"${category}",${cost.toFixed(2)}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workshop-report-${reportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Reports & Analytics</h2>
        <div className="report-controls">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
            <option value="overview">Overview</option>
            <option value="stock">Stock Report</option>
            <option value="expenses">Expenses by Asset</option>
            <option value="categories">Expenses by Category</option>
          </select>
          {reportType !== 'overview' && (
            <button className="btn btn-secondary" onClick={exportToCSV}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </div>

      {reportType === 'overview' && (
        <div>
          <div className="stats-grid stats-grid-4">
            <div className="stat-card">
              <h3>Total Stock Value</h3>
              <p className="stat-value">{getCurrencySymbol()}{getStockValue().toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>Total Expenses</h3>
              <p className="stat-value">{getCurrencySymbol()}{getTotalExpenses().toFixed(2)}</p>
            </div>
            <div className="stat-card">
              <h3>Completed Jobs</h3>
              <p className="stat-value">{jobCards.filter(jc => jc.status === 'completed').length}</p>
            </div>
            <div className="stat-card">
              <h3>Active Assets</h3>
              <p className="stat-value">{assets.length}</p>
            </div>
          </div>

          <div className="report-section">
            <div className="section-header">
              <h3><BarChart3 size={20} /> Top 5 Expensive Assets</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Job Cards</th>
                  <th>Total Expenses</th>
                </tr>
              </thead>
              <tbody>
                {getExpensesByAsset().slice(0, 5).map(({ asset, jobCardCount, totalCost }) => (
                  <tr key={asset.id}>
                    <td>{asset.name}</td>
                    <td><span className="badge">{asset.type}</span></td>
                    <td>{jobCardCount}</td>
                    <td>{getCurrencySymbol()}{totalCost.toFixed(2)}</td>
                  </tr>
                ))}
                {getExpensesByAsset().length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="report-section">
            <div className="section-header">
              <h3><PieChart size={20} /> Expenses by Category</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Total Cost</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {getExpensesByCategory().map(({ category, cost }) => {
                  const percentage = (cost / getTotalExpenses() * 100).toFixed(1);
                  return (
                    <tr key={category}>
                      <td>{category}</td>
                      <td>{getCurrencySymbol()}{cost.toFixed(2)}</td>
                      <td>
                        <div className="percentage-bar">
                          <div className="percentage-fill" style={{ width: `${percentage}%` }}></div>
                          <span>{percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {getExpensesByCategory().length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {getLowStockItems().length > 0 && (
            <div className="report-section">
              <div className="section-header">
                <h3>⚠️ Low Stock Alerts</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {getLowStockItems().map(item => {
                    const qty = item.totalQuantity !== undefined ? item.totalQuantity : item.quantity;
                    return (
                      <tr key={item.id} className="low-stock">
                        <td>{item.name}</td>
                        <td><span className="badge">{item.category}</span></td>
                        <td>{qty}</td>
                        <td><span className="warning-badge">Low Stock</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {reportType === 'stock' && (
        <div className="report-section">
          <div className="section-header">
            <h3>Stock Inventory Report</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Part Number</th>
                <th>Category</th>
                <th>Quantity</th>
                <th>Unit Cost</th>
                <th>Total Value</th>
              </tr>
            </thead>
            <tbody>
              {stock.map(item => {
                const qty = item.totalQuantity !== undefined ? item.totalQuantity : item.quantity;
                const cost = item.averageCost !== undefined ? item.averageCost : item.unitCost;
                return (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.partNumber || '-'}</td>
                    <td><span className="badge">{item.category}</span></td>
                    <td>{qty}</td>
                    <td>{getCurrencySymbol()}{cost.toFixed(2)}</td>
                    <td>{getCurrencySymbol()}{(qty * cost).toFixed(2)}</td>
                  </tr>
                );
              })}
              {stock.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                    No stock items available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'expenses' && (
        <div className="report-section">
          <div className="section-header">
            <h3>Expenses by Asset</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Type</th>
                <th>Registration</th>
                <th>Job Cards</th>
                <th>Total Expenses</th>
              </tr>
            </thead>
            <tbody>
              {getExpensesByAsset().map(({ asset, jobCardCount, totalCost }) => (
                <tr key={asset.id}>
                  <td>{asset.name}</td>
                  <td><span className="badge">{asset.type}</span></td>
                  <td>{asset.registrationNumber || '-'}</td>
                  <td>{jobCardCount}</td>
                  <td>{getCurrencySymbol()}{totalCost.toFixed(2)}</td>
                </tr>
              ))}
              {getExpensesByAsset().length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                    No expense data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'categories' && (
        <div className="report-section">
          <div className="section-header">
            <h3>Expenses by Category</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Cost</th>
                <th>Percentage of Total</th>
              </tr>
            </thead>
            <tbody>
              {getExpensesByCategory().map(({ category, cost }) => {
                const percentage = getTotalExpenses() > 0 ? (cost / getTotalExpenses() * 100).toFixed(1) : 0;
                return (
                  <tr key={category}>
                    <td>{category}</td>
                    <td>{getCurrencySymbol()}{cost.toFixed(2)}</td>
                    <td>
                      <div className="percentage-bar">
                        <div className="percentage-fill" style={{ width: `${percentage}%` }}></div>
                        <span>{percentage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {getExpensesByCategory().length === 0 && (
                <tr>
                  <td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>
                    No category data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reports;
