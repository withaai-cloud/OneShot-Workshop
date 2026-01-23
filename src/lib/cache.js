// src/lib/cache.js
// Cache layer for instant loads with Supabase sync

const CACHE_KEYS = {
  STOCK: 'workshop_cache_stock',
  JOB_CARDS: 'workshop_cache_jobcards',
  ASSETS: 'workshop_cache_assets',
  SUPPLIERS: 'workshop_cache_suppliers',
  SETTINGS: 'workshop_cache_settings',
  TIMESTAMP: 'workshop_cache_timestamp',
  USER_ID: 'workshop_cache_userid'
};

// Cache timeout - how long cache is valid (5 minutes)
const CACHE_TIMEOUT = 5 * 60 * 1000;

// Check if cache is fresh
export const isCacheFresh = () => {
  try {
    const timestamp = localStorage.getItem(CACHE_KEYS.TIMESTAMP);
    if (!timestamp) return false;
    
    const age = Date.now() - parseInt(timestamp);
    return age < CACHE_TIMEOUT;
  } catch (error) {
    console.error('Error checking cache freshness:', error);
    return false;
  }
};

// Check if cache belongs to current user
export const isCacheForUser = (userId) => {
  try {
    const cachedUserId = localStorage.getItem(CACHE_KEYS.USER_ID);
    return cachedUserId === userId;
  } catch (error) {
    console.error('Error checking cache user:', error);
    return false;
  }
};

// Get cached data
export const getCachedData = (userId) => {
  try {
    // Check if cache is valid
    if (!isCacheForUser(userId)) {
      console.log('Cache is for different user, clearing...');
      clearCache();
      return null;
    }

    if (!isCacheFresh()) {
      console.log('Cache is stale');
      return null;
    }

    console.log('Loading from cache...');

    const stock = JSON.parse(localStorage.getItem(CACHE_KEYS.STOCK) || '[]');
    const jobCards = JSON.parse(localStorage.getItem(CACHE_KEYS.JOB_CARDS) || '[]');
    const assets = JSON.parse(localStorage.getItem(CACHE_KEYS.ASSETS) || '[]');
    const suppliers = JSON.parse(localStorage.getItem(CACHE_KEYS.SUPPLIERS) || '[]');
    const settings = JSON.parse(localStorage.getItem(CACHE_KEYS.SETTINGS) || '{"currency":"ZAR","inventory_method":"FIFO"}');

    return {
      stock,
      jobCards,
      assets,
      suppliers,
      settings
    };
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

// Save data to cache
export const setCachedData = (userId, data) => {
  try {
    console.log('Saving to cache...');
    
    localStorage.setItem(CACHE_KEYS.USER_ID, userId);
    localStorage.setItem(CACHE_KEYS.STOCK, JSON.stringify(data.stock || []));
    localStorage.setItem(CACHE_KEYS.JOB_CARDS, JSON.stringify(data.jobCards || []));
    localStorage.setItem(CACHE_KEYS.ASSETS, JSON.stringify(data.assets || []));
    localStorage.setItem(CACHE_KEYS.SUPPLIERS, JSON.stringify(data.suppliers || []));
    localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(data.settings || { currency: 'ZAR', inventory_method: 'FIFO' }));
    localStorage.setItem(CACHE_KEYS.TIMESTAMP, Date.now().toString());

    console.log('Cache saved successfully');
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

// Clear cache
export const clearCache = () => {
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('Cache cleared');
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

// Invalidate cache (force fresh load on next request)
export const invalidateCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.TIMESTAMP);
    console.log('Cache invalidated');
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
};