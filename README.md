# Workshop Manager

A comprehensive web application for managing workshop expenses, stock inventory, and asset maintenance tracking. Built specifically for South African workshops but supports multiple currencies.

## Features

### 📦 Stock Management
- Add, edit, and delete stock items
- Track quantity, unit cost, and total value
- Categorize items (Parts, Fluids, Filters, Consumables, Tools, Other)
- Low stock alerts (items with quantity < 5)
- Real-time inventory tracking
- Search and filter functionality

### 📝 Job Cards
- Create and manage job cards
- Allocate job cards to specific assets
- Add multiple stock items per job card
- Track labor costs separately
- Draft and completed status
- Automatic stock deduction when job cards are completed
- Detailed job card viewing

### 🚗 Asset Management
- Manage vehicles, trailers, implements, and equipment
- Track registration numbers, make, model, and year
- View total expenses per asset
- See job card count per asset
- Link job cards to assets for expense tracking

### 📊 Reports & Analytics
- **Overview Dashboard**: Quick stats and insights
- **Stock Report**: Complete inventory listing with values
- **Expenses by Asset**: Track which assets cost the most
- **Expenses by Category**: Breakdown of spending by category
- Top 5 most expensive assets
- Low stock alerts
- CSV export for all reports

### ⚙️ Settings
- **Multi-Currency Support**: ZAR (default), USD, EUR, GBP
- **Data Backup**: Export all data as JSON
- **Data Import**: Restore from previous backups
- **Clear All Data**: Fresh start option

## Technology Stack

- **Frontend**: React 18
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Styling**: Custom CSS
- **Data Storage**: Browser LocalStorage

## Installation

1. **Clone or download the project**

2. **Install dependencies**
   ```bash
   cd workshop-manager
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open in browser**
   The app will automatically open at `http://localhost:3000`

## Usage Guide

### Initial Setup

1. **Set Your Currency** (Optional)
   - Navigate to Settings
   - Select your preferred currency (Default: ZAR)

2. **Add Assets**
   - Go to the Assets page
   - Click "Add Asset"
   - Fill in details about your vehicles, trailers, or implements

3. **Add Stock Items**
   - Go to the Stock page
   - Click "Add Stock Item"
   - Enter item details including quantity and unit cost

### Creating Job Cards

1. Navigate to Job Cards page
2. Click "Create Job Card"
3. Fill in job details:
   - Job title
   - Select the asset
   - Date
   - Description
   - Labor cost
4. Add items used:
   - Click "Add Item"
   - Select stock item from dropdown
   - Enter quantity used
   - Add optional notes
5. Save as draft or complete:
   - **Save as Draft**: Saves without deducting stock
   - **Save & Complete**: Deducts items from stock inventory

### Viewing Reports

1. Navigate to Reports page
2. Select report type from dropdown:
   - Overview (default dashboard)
   - Stock Report
   - Expenses by Asset
   - Expenses by Category
3. Click "Export CSV" to download report data

### Data Backup

**Export Data:**
1. Go to Settings
2. Click "Export Backup"
3. Save the JSON file to your computer

**Import Data:**
1. Go to Settings
2. Click "Import Backup"
3. Select your previously exported JSON file
4. Confirm the import

## Data Storage

All data is stored locally in your browser using LocalStorage. This means:
- ✅ No internet connection required
- ✅ Data persists between sessions
- ✅ Fast and responsive
- ⚠️ Data is browser-specific (not synced across devices)
- ⚠️ Clearing browser data will delete your workshop data

**Important**: Regular backups are recommended! Use the Export function in Settings.

## Features in Detail

### Stock Deduction Logic
When a job card is saved as "completed":
1. The app checks stock availability
2. If sufficient stock exists, quantities are deducted
3. If insufficient stock, an alert is shown
4. Stock levels update immediately

### Low Stock Alerts
- Items with quantity < 5 are highlighted in red
- Warning badge appears in stock table
- Low stock items shown in Reports overview

### Multi-Currency Display
- Currency symbol changes throughout the app
- Calculations remain the same
- Only display format changes

### Job Card Status
- **Draft**: Can be edited, doesn't affect stock
- **Completed**: Stock is deducted, limited editing

## Browser Compatibility

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser with LocalStorage support

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## Project Structure

```
workshop-manager/
├── public/
├── src/
│   ├── components/
│   │   ├── Stock.js
│   │   ├── JobCards.js
│   │   ├── Assets.js
│   │   ├── Reports.js
│   │   └── Settings.js
│   ├── App.js
│   ├── App.css
│   └── index.js
├── package.json
└── README.md
```

## Troubleshooting

**Data not saving?**
- Check if LocalStorage is enabled in your browser
- Ensure you're not in Private/Incognito mode

**Stock not deducting?**
- Make sure you clicked "Save & Complete" not just "Save as Draft"
- Check that the job card status shows "completed"

**Can't see my data after closing browser?**
- Data should persist automatically
- If it doesn't, export a backup before closing

## Future Enhancements (Potential)

- Cloud synchronization
- Multi-user support
- Advanced reporting with charts
- PDF export for job cards
- Supplier management
- Purchase order tracking
- Barcode scanning for stock items

## Support

For issues or questions:
1. Check this README
2. Review the in-app Settings > About section
3. Export your data before making major changes

## License

This is a custom-built application for workshop management. Free to use and modify for your workshop needs.

---

**Version**: 1.0  
**Built with**: React  
**Optimized for**: South African workshops (multi-currency support available)
