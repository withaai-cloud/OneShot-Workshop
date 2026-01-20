import { supabase } from './supabase';

// ============================================
// AUTH FUNCTIONS
// ============================================

export const signUp = async (email, password, name, workshopName) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        workshop_name: workshopName
      }
    }
  });

  if (error) throw error;
  return data;
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
};

// ============================================
// PROFILE FUNCTIONS
// ============================================

export const getProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates, updated_at: new Date().toISOString() })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// SETTINGS FUNCTIONS
// ============================================

export const getSettings = async (userId) => {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
};

export const updateSettings = async (userId, settings) => {
  const { data, error } = await supabase
    .from('settings')
    .upsert({
      user_id: userId,
      ...settings,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// SUPPLIERS FUNCTIONS
// ============================================

export const getSuppliers = async (userId) => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const addSupplier = async (userId, supplier) => {
  const { data, error } = await supabase
    .from('suppliers')
    .insert({
      user_id: userId,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
      address: supplier.address,
      notes: supplier.notes
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateSupplier = async (supplierId, updates) => {
  const { data, error } = await supabase
    .from('suppliers')
    .update({
      name: updates.name,
      contact_person: updates.contactPerson,
      email: updates.email,
      phone: updates.phone,
      address: updates.address,
      notes: updates.notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', supplierId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteSupplier = async (supplierId) => {
  const { error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', supplierId);

  if (error) throw error;
};

// ============================================
// STOCK FUNCTIONS
// ============================================

export const getStock = async (userId) => {
  const { data, error } = await supabase
    .from('stock')
    .select(`
      *,
      stock_batches (
        id,
        date,
        quantity,
        unit_cost,
        invoice_number,
        created_at
      ),
      stock_usage (
        id,
        date,
        quantity,
        cost,
        job_card_id,
        job_card_title,
        asset_name,
        created_at
      )
    `)
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;

  // Transform data to match frontend structure
  return (data || []).map(item => ({
    id: item.id,
    name: item.name,
    description: item.description,
    partNumber: item.part_number,
    category: item.category,
    supplierId: item.supplier_id,
    totalQuantity: item.total_quantity,
    averageCost: parseFloat(item.average_cost) || 0,
    batches: (item.stock_batches || []).map(batch => ({
      batchId: batch.id,
      date: batch.date,
      quantity: batch.quantity,
      unitCost: parseFloat(batch.unit_cost) || 0,
      invoiceNumber: batch.invoice_number
    })).sort((a, b) => new Date(a.date) - new Date(b.date)),
    usageHistory: (item.stock_usage || []).map(usage => ({
      id: usage.id,
      date: usage.date,
      quantity: usage.quantity,
      cost: parseFloat(usage.cost) || 0,
      jobCardId: usage.job_card_id,
      jobCardTitle: usage.job_card_title,
      assetName: usage.asset_name
    })).sort((a, b) => new Date(b.date) - new Date(a.date))
  }));
};

export const addStock = async (userId, item) => {
  // First create the stock item
  const { data: stockData, error: stockError } = await supabase
    .from('stock')
    .insert({
      user_id: userId,
      name: item.name,
      description: item.description,
      part_number: item.partNumber,
      category: item.category,
      supplier_id: item.supplierId || null,
      total_quantity: item.totalQuantity,
      average_cost: item.averageCost
    })
    .select()
    .single();

  if (stockError) throw stockError;

  // Then create the initial batch
  if (item.batches && item.batches.length > 0) {
    const batch = item.batches[0];
    const { error: batchError } = await supabase
      .from('stock_batches')
      .insert({
        stock_id: stockData.id,
        date: batch.date,
        quantity: batch.quantity,
        unit_cost: batch.unitCost,
        invoice_number: batch.invoiceNumber || null
      });

    if (batchError) throw batchError;
  }

  return { ...stockData, batches: item.batches || [] };
};

export const updateStock = async (stockId, updates) => {
  const { data, error } = await supabase
    .from('stock')
    .update({
      name: updates.name,
      description: updates.description,
      part_number: updates.partNumber,
      category: updates.category,
      supplier_id: updates.supplierId || null,
      total_quantity: updates.totalQuantity,
      average_cost: updates.averageCost,
      updated_at: new Date().toISOString()
    })
    .eq('id', stockId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteStock = async (stockId) => {
  // Batches and usage will be deleted by cascade
  const { error } = await supabase
    .from('stock')
    .delete()
    .eq('id', stockId);

  if (error) throw error;
};

// ============================================
// STOCK BATCHES FUNCTIONS
// ============================================

export const addStockBatch = async (stockId, batch) => {
  const { data, error } = await supabase
    .from('stock_batches')
    .insert({
      stock_id: stockId,
      date: batch.date,
      quantity: batch.quantity,
      unit_cost: batch.unitCost,
      invoice_number: batch.invoiceNumber || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateStockBatch = async (batchId, updates) => {
  const { data, error } = await supabase
    .from('stock_batches')
    .update({
      date: updates.date,
      quantity: updates.quantity,
      unit_cost: updates.unitCost,
      invoice_number: updates.invoiceNumber
    })
    .eq('id', batchId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// STOCK USAGE FUNCTIONS
// ============================================

export const addStockUsage = async (stockId, usage) => {
  const { data, error } = await supabase
    .from('stock_usage')
    .insert({
      stock_id: stockId,
      date: usage.date,
      quantity: usage.quantity,
      cost: usage.cost,
      job_card_id: usage.jobCardId || null,
      job_card_title: usage.jobCardTitle,
      asset_name: usage.assetName || null
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

// ============================================
// ASSETS FUNCTIONS
// ============================================

export const getAssets = async (userId) => {
  const { data, error } = await supabase
    .from('assets')
    .select('*')
    .eq('user_id', userId)
    .order('name');

  if (error) throw error;

  return (data || []).map(asset => ({
    id: asset.id,
    name: asset.name,
    description: asset.description,
    registrationNumber: asset.registration_number,
    category: asset.category,
    purchaseDate: asset.purchase_date,
    purchasePrice: parseFloat(asset.purchase_price) || 0,
    currentValue: parseFloat(asset.current_value) || 0,
    status: asset.status
  }));
};

export const addAsset = async (userId, asset) => {
  const { data, error } = await supabase
    .from('assets')
    .insert({
      user_id: userId,
      name: asset.name,
      description: asset.description,
      registration_number: asset.registrationNumber,
      category: asset.category,
      purchase_date: asset.purchaseDate,
      purchase_price: asset.purchasePrice,
      current_value: asset.currentValue,
      status: asset.status
    })
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    registrationNumber: data.registration_number,
    purchaseDate: data.purchase_date,
    purchasePrice: parseFloat(data.purchase_price) || 0,
    currentValue: parseFloat(data.current_value) || 0
  };
};

export const updateAsset = async (assetId, updates) => {
  const { data, error } = await supabase
    .from('assets')
    .update({
      name: updates.name,
      description: updates.description,
      registration_number: updates.registrationNumber,
      category: updates.category,
      purchase_date: updates.purchaseDate,
      purchase_price: updates.purchasePrice,
      current_value: updates.currentValue,
      status: updates.status,
      updated_at: new Date().toISOString()
    })
    .eq('id', assetId)
    .select()
    .single();

  if (error) throw error;
  return {
    ...data,
    registrationNumber: data.registration_number,
    purchaseDate: data.purchase_date,
    purchasePrice: parseFloat(data.purchase_price) || 0,
    currentValue: parseFloat(data.current_value) || 0
  };
};

export const deleteAsset = async (assetId) => {
  const { error } = await supabase
    .from('assets')
    .delete()
    .eq('id', assetId);

  if (error) throw error;
};

// ============================================
// JOB CARDS FUNCTIONS
// ============================================

export const getJobCards = async (userId) => {
  const { data, error } = await supabase
    .from('job_cards')
    .select(`
      *,
      job_card_items (
        id,
        stock_id,
        stock_name,
        quantity,
        unit_cost,
        total_cost
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(jc => ({
    id: jc.id,
    title: jc.title,
    description: jc.description,
    assetId: jc.asset_id,
    assetName: jc.asset_name,
    status: jc.status,
    laborCost: parseFloat(jc.labor_cost) || 0,
    totalCost: parseFloat(jc.total_cost) || 0,
    createdAt: jc.created_at,
    completedAt: jc.completed_at,
    items: (jc.job_card_items || []).map(item => ({
      id: item.id,
      stockId: item.stock_id,
      stockName: item.stock_name,
      quantity: item.quantity,
      unitCost: parseFloat(item.unit_cost) || 0,
      totalCost: parseFloat(item.total_cost) || 0
    }))
  }));
};

export const addJobCard = async (userId, jobCard) => {
  const { data, error } = await supabase
    .from('job_cards')
    .insert({
      user_id: userId,
      title: jobCard.title,
      description: jobCard.description,
      asset_id: jobCard.assetId || null,
      asset_name: jobCard.assetName || null,
      status: jobCard.status || 'draft',
      labor_cost: jobCard.laborCost || 0,
      total_cost: jobCard.totalCost || 0,
      completed_at: jobCard.status === 'completed' ? new Date().toISOString() : null
    })
    .select()
    .single();

  if (error) throw error;

  // Add job card items
  if (jobCard.items && jobCard.items.length > 0) {
    const itemsToInsert = jobCard.items.map(item => ({
      job_card_id: data.id,
      stock_id: item.stockId,
      stock_name: item.stockName,
      quantity: item.quantity,
      unit_cost: item.unitCost,
      total_cost: item.totalCost
    }));

    const { error: itemsError } = await supabase
      .from('job_card_items')
      .insert(itemsToInsert);

    if (itemsError) throw itemsError;
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    assetId: data.asset_id,
    assetName: data.asset_name,
    status: data.status,
    laborCost: parseFloat(data.labor_cost) || 0,
    totalCost: parseFloat(data.total_cost) || 0,
    createdAt: data.created_at,
    completedAt: data.completed_at,
    items: jobCard.items || []
  };
};

export const updateJobCard = async (jobCardId, updates) => {
  const { data, error } = await supabase
    .from('job_cards')
    .update({
      title: updates.title,
      description: updates.description,
      asset_id: updates.assetId || null,
      asset_name: updates.assetName || null,
      status: updates.status,
      labor_cost: updates.laborCost || 0,
      total_cost: updates.totalCost || 0,
      completed_at: updates.status === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', jobCardId)
    .select()
    .single();

  if (error) throw error;

  // Update job card items - delete existing and insert new
  if (updates.items) {
    await supabase
      .from('job_card_items')
      .delete()
      .eq('job_card_id', jobCardId);

    if (updates.items.length > 0) {
      const itemsToInsert = updates.items.map(item => ({
        job_card_id: jobCardId,
        stock_id: item.stockId,
        stock_name: item.stockName,
        quantity: item.quantity,
        unit_cost: item.unitCost,
        total_cost: item.totalCost
      }));

      await supabase
        .from('job_card_items')
        .insert(itemsToInsert);
    }
  }

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    assetId: data.asset_id,
    assetName: data.asset_name,
    status: data.status,
    laborCost: parseFloat(data.labor_cost) || 0,
    totalCost: parseFloat(data.total_cost) || 0,
    createdAt: data.created_at,
    completedAt: data.completed_at,
    items: updates.items || []
  };
};

export const deleteJobCard = async (jobCardId) => {
  // Items will be deleted by cascade
  const { error } = await supabase
    .from('job_cards')
    .delete()
    .eq('id', jobCardId);

  if (error) throw error;
};

// ============================================
// BULK DATA LOADING
// ============================================

export const loadAllUserData = async (userId) => {
  try {
    const [settings, suppliers, stock, assets, jobCards] = await Promise.all([
      getSettings(userId),
      getSuppliers(userId),
      getStock(userId),
      getAssets(userId),
      getJobCards(userId)
    ]);

    return {
      settings: settings || { currency: 'ZAR', inventory_method: 'FIFO' },
      suppliers,
      stock,
      assets,
      jobCards
    };
  } catch (error) {
    console.error('Error loading user data:', error);
    throw error;
  }
};

// ============================================
// DATA MANAGEMENT
// ============================================

export const clearAllUserData = async (userId) => {
  // Delete in order to respect foreign keys
  await supabase.from('job_card_items').delete().eq('job_card_id',
    supabase.from('job_cards').select('id').eq('user_id', userId)
  );
  await supabase.from('stock_usage').delete().eq('stock_id',
    supabase.from('stock').select('id').eq('user_id', userId)
  );
  await supabase.from('stock_batches').delete().eq('stock_id',
    supabase.from('stock').select('id').eq('user_id', userId)
  );

  await Promise.all([
    supabase.from('job_cards').delete().eq('user_id', userId),
    supabase.from('stock').delete().eq('user_id', userId),
    supabase.from('assets').delete().eq('user_id', userId),
    supabase.from('suppliers').delete().eq('user_id', userId)
  ]);
};

export const exportUserData = async (userId) => {
  const data = await loadAllUserData(userId);
  return JSON.stringify(data, null, 2);
};

export const importUserData = async (userId, jsonData) => {
  const data = JSON.parse(jsonData);

  // Clear existing data first
  await clearAllUserData(userId);

  // Import suppliers first (other items may reference them)
  if (data.suppliers && data.suppliers.length > 0) {
    for (const supplier of data.suppliers) {
      await addSupplier(userId, supplier);
    }
  }

  // Import assets
  if (data.assets && data.assets.length > 0) {
    for (const asset of data.assets) {
      await addAsset(userId, asset);
    }
  }

  // Import stock
  if (data.stock && data.stock.length > 0) {
    for (const item of data.stock) {
      await addStock(userId, item);
    }
  }

  // Import job cards
  if (data.jobCards && data.jobCards.length > 0) {
    for (const jc of data.jobCards) {
      await addJobCard(userId, jc);
    }
  }

  // Update settings
  if (data.settings) {
    await updateSettings(userId, data.settings);
  }
};
