// src/lib/firebaseApi.js
import { auth, db } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';

// ==================== AUTH ====================

export const signUp = async (email, password, fullName, workshopName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update user profile with display name
  await updateProfile(user, {
    displayName: fullName
  });

  // Create user profile document
  await setDoc(doc(db, 'profiles', user.uid), {
    id: user.uid,
    email: email,
    full_name: fullName,
    workshop_name: workshopName,
    created_at: new Date().toISOString()
  });

  // Create default settings
  await setDoc(doc(db, 'settings', user.uid), {
    user_id: user.uid,
    currency: 'ZAR',
    inventory_method: 'FIFO'
  });

  return { user };
};

export const signIn = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return { user: userCredential.user };
};

export const signOut = async () => {
  await firebaseSignOut(auth);
};

export const getSession = async () => {
  return auth.currentUser ? { user: auth.currentUser } : null;
};

export const getCurrentUser = async () => {
  return auth.currentUser;
};

// ==================== PROFILE ====================

export const getProfile = async (userId) => {
  const docRef = doc(db, 'profiles', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name || '',
      workshopName: data.workshop_name || '',
      createdAt: data.created_at
    };
  }
  return null;
};

export const updateProfileData = async (userId, updates) => {
  const docRef = doc(db, 'profiles', userId);
  const dbUpdates = {
    full_name: updates.fullName,
    workshop_name: updates.workshopName
  };
  await updateDoc(docRef, dbUpdates);

  // Return transformed data (camelCase)
  return {
    id: userId,
    fullName: updates.fullName,
    workshopName: updates.workshopName
  };
};

// ==================== SETTINGS ====================

const DEFAULT_CATEGORIES = ['Parts', 'Fluids', 'Filters', 'Consumables', 'Tools', 'Other'];

export const getSettings = async (userId) => {
  const docRef = doc(db, 'settings', userId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      currency: data.currency || 'ZAR',
      inventoryMethod: data.inventory_method || 'FIFO',
      categories: data.categories || DEFAULT_CATEGORIES
    };
  }
  // Return defaults if not found
  return { currency: 'ZAR', inventoryMethod: 'FIFO', categories: DEFAULT_CATEGORIES };
};

export const updateSettings = async (userId, updates) => {
  const docRef = doc(db, 'settings', userId);
  const dbUpdates = {
    user_id: userId,
    currency: updates.currency,
    inventory_method: updates.inventoryMethod,
    categories: updates.categories || DEFAULT_CATEGORIES
  };
  await setDoc(docRef, dbUpdates, { merge: true });

  // Return transformed data (camelCase)
  return {
    currency: updates.currency,
    inventoryMethod: updates.inventoryMethod,
    categories: updates.categories || DEFAULT_CATEGORIES
  };
};

// ==================== SUPPLIERS ====================

export const fetchSuppliers = async (userId) => {
  const q = query(
    collection(db, 'suppliers'),
    where('user_id', '==', userId),
    orderBy('name')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name || '',
      contactPerson: data.contact_person || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      notes: data.notes || ''
    };
  });
};

export const createSupplier = async (supplierData, userId) => {
  const docRef = doc(collection(db, 'suppliers'));
  const data = {
    user_id: userId,
    name: supplierData.name,
    contact_person: supplierData.contactPerson || '',
    email: supplierData.email || '',
    phone: supplierData.phone || '',
    address: supplierData.address || '',
    notes: supplierData.notes || '',
    created_at: new Date().toISOString()
  };
  await setDoc(docRef, data);

  // Return transformed data (camelCase)
  return {
    id: docRef.id,
    name: data.name,
    contactPerson: data.contact_person,
    email: data.email,
    phone: data.phone,
    address: data.address,
    notes: data.notes
  };
};

export const updateSupplier = async (supplierId, updates) => {
  const docRef = doc(db, 'suppliers', supplierId);
  const dbUpdates = {
    name: updates.name,
    contact_person: updates.contactPerson,
    email: updates.email,
    phone: updates.phone,
    address: updates.address,
    notes: updates.notes
  };
  await updateDoc(docRef, dbUpdates);

  // Return transformed data (camelCase)
  return {
    id: supplierId,
    name: updates.name,
    contactPerson: updates.contactPerson,
    email: updates.email,
    phone: updates.phone,
    address: updates.address,
    notes: updates.notes
  };
};

export const deleteSupplier = async (supplierId) => {
  await deleteDoc(doc(db, 'suppliers', supplierId));
};

// ==================== STOCK ====================

export const fetchStock = async (userId) => {
  const q = query(
    collection(db, 'stock'),
    where('user_id', '==', userId),
    orderBy('name')
  );
  const querySnapshot = await getDocs(q);

  const stockItems = [];
  for (const docSnap of querySnapshot.docs) {
    const stockData = docSnap.data();
    const stockId = docSnap.id;

    // Fetch batches for this stock item
    const batchesQuery = query(
      collection(db, 'stock_batches'),
      where('stock_id', '==', stockId),
      orderBy('created_at')
    );
    const batchesSnapshot = await getDocs(batchesQuery);
    const batches = batchesSnapshot.docs.map(b => ({
      batchId: b.id,
      date: b.data().purchase_date,
      quantity: parseFloat(b.data().quantity),
      unitCost: parseFloat(b.data().unit_cost),
      invoiceNumber: b.data().invoice_number
    }));

    // Fetch usage history for this stock item
    const usageQuery = query(
      collection(db, 'stock_usage'),
      where('stock_id', '==', stockId),
      orderBy('created_at')
    );
    const usageSnapshot = await getDocs(usageQuery);
    const usageHistory = usageSnapshot.docs.map(u => ({
      date: u.data().usage_date,
      quantity: parseFloat(u.data().quantity),
      cost: parseFloat(u.data().cost),
      jobCardTitle: u.data().job_card_title,
      assetName: u.data().asset_name
    }));

    // Fetch writeoffs for this stock item
    const writeoffsQuery = query(
      collection(db, 'stock_writeoffs'),
      where('stock_id', '==', stockId),
      orderBy('created_at')
    );
    const writeoffsSnapshot = await getDocs(writeoffsQuery);
    const writeoffs = writeoffsSnapshot.docs.map(w => ({
      id: w.id,
      date: w.data().writeoff_date,
      quantity: parseFloat(w.data().quantity),
      cost: parseFloat(w.data().cost),
      reason: w.data().reason,
      notes: w.data().notes || ''
    }));

    stockItems.push({
      id: stockId,
      name: stockData.name,
      description: stockData.description,
      partNumber: stockData.part_number,
      category: stockData.category,
      supplierId: stockData.supplier_id,
      totalQuantity: parseFloat(stockData.total_quantity) || 0,
      averageCost: parseFloat(stockData.average_cost) || 0,
      batches,
      usageHistory,
      writeoffs
    });
  }

  return stockItems;
};

export const createStock = async (stockData, userId) => {
  const docRef = doc(collection(db, 'stock'));
  const data = {
    user_id: userId,
    supplier_id: stockData.supplierId || null,
    name: stockData.name,
    description: stockData.description || '',
    part_number: stockData.partNumber || '',
    category: stockData.category,
    total_quantity: stockData.totalQuantity || 0,
    average_cost: stockData.averageCost || 0,
    created_at: new Date().toISOString()
  };
  await setDoc(docRef, data);

  return {
    id: docRef.id,
    name: data.name,
    description: data.description,
    partNumber: data.part_number,
    category: data.category,
    supplierId: data.supplier_id,
    totalQuantity: data.total_quantity,
    averageCost: data.average_cost,
    batches: [],
    usageHistory: []
  };
};

export const updateStock = async (stockId, updates) => {
  const docRef = doc(db, 'stock', stockId);
  const dbUpdates = {
    name: updates.name,
    description: updates.description,
    part_number: updates.partNumber,
    category: updates.category,
    supplier_id: updates.supplierId,
    total_quantity: updates.totalQuantity,
    average_cost: updates.averageCost
  };
  await updateDoc(docRef, dbUpdates);

  // Return transformed data (camelCase)
  return {
    id: stockId,
    name: updates.name,
    description: updates.description,
    partNumber: updates.partNumber,
    category: updates.category,
    supplierId: updates.supplierId,
    totalQuantity: updates.totalQuantity,
    averageCost: updates.averageCost,
    batches: updates.batches || [],
    usageHistory: updates.usageHistory || []
  };
};

export const deleteStock = async (stockId) => {
  // Delete related batches
  const batchesQuery = query(collection(db, 'stock_batches'), where('stock_id', '==', stockId));
  const batchesSnapshot = await getDocs(batchesQuery);
  const batch = writeBatch(db);
  batchesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  // Delete related usage records
  const usageQuery = query(collection(db, 'stock_usage'), where('stock_id', '==', stockId));
  const usageSnapshot = await getDocs(usageQuery);
  usageSnapshot.docs.forEach(doc => batch.delete(doc.ref));

  await batch.commit();
  await deleteDoc(doc(db, 'stock', stockId));
};

// ==================== STOCK BATCHES ====================

export const addStockBatch = async (stockId, batchData, userId) => {
  const docRef = doc(collection(db, 'stock_batches'));
  const data = {
    stock_id: stockId,
    user_id: userId,
    purchase_date: batchData.date,
    quantity: batchData.quantity,
    unit_cost: batchData.unitCost,
    invoice_number: batchData.invoiceNumber || null,
    created_at: new Date().toISOString()
  };
  await setDoc(docRef, data);

  return {
    batchId: docRef.id,
    date: data.purchase_date,
    quantity: parseFloat(data.quantity),
    unitCost: parseFloat(data.unit_cost),
    invoiceNumber: data.invoice_number
  };
};

export const addStockUsage = async (stockId, usageData, userId) => {
  const docRef = doc(collection(db, 'stock_usage'));
  const data = {
    stock_id: stockId,
    user_id: userId,
    usage_date: usageData.date,
    quantity: usageData.quantity,
    cost: usageData.cost,
    job_card_title: usageData.jobCardTitle,
    asset_name: usageData.assetName || '',
    created_at: new Date().toISOString()
  };
  await setDoc(docRef, data);

  // Return transformed data (camelCase)
  return {
    id: docRef.id,
    date: usageData.date,
    quantity: parseFloat(usageData.quantity) || 0,
    cost: parseFloat(usageData.cost) || 0,
    jobCardTitle: usageData.jobCardTitle,
    assetName: usageData.assetName || ''
  };
};

export const addStockWriteoff = async (stockId, writeoffData, userId) => {
  const docRef = doc(collection(db, 'stock_writeoffs'));
  const data = {
    stock_id: stockId,
    user_id: userId,
    writeoff_date: writeoffData.date,
    quantity: writeoffData.quantity,
    cost: writeoffData.cost,
    reason: writeoffData.reason,
    notes: writeoffData.notes || '',
    created_at: new Date().toISOString()
  };
  await setDoc(docRef, data);

  return {
    id: docRef.id,
    date: writeoffData.date,
    quantity: parseFloat(writeoffData.quantity) || 0,
    cost: parseFloat(writeoffData.cost) || 0,
    reason: writeoffData.reason,
    notes: writeoffData.notes || ''
  };
};

export const fetchStockWriteoffs = async (stockId) => {
  const q = query(
    collection(db, 'stock_writeoffs'),
    where('stock_id', '==', stockId),
    orderBy('writeoff_date', 'desc')
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      date: data.writeoff_date,
      quantity: parseFloat(data.quantity) || 0,
      cost: parseFloat(data.cost) || 0,
      reason: data.reason,
      notes: data.notes || ''
    };
  });
};

// ==================== ASSETS ====================

export const fetchAssets = async (userId) => {
  const q = query(
    collection(db, 'assets'),
    where('user_id', '==', userId),
    orderBy('name')
  );
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      type: data.type,
      registrationNumber: data.registration_number,
      make: data.make,
      model: data.model,
      year: data.year,
      description: data.description
    };
  });
};

export const createAsset = async (assetData, userId) => {
  const docRef = doc(collection(db, 'assets'));
  const data = {
    user_id: userId,
    name: assetData.name,
    type: assetData.type,
    registration_number: assetData.registrationNumber || '',
    make: assetData.make || '',
    model: assetData.model || '',
    year: assetData.year || '',
    description: assetData.description || '',
    created_at: new Date().toISOString()
  };
  await setDoc(docRef, data);

  return {
    id: docRef.id,
    name: data.name,
    type: data.type,
    registrationNumber: data.registration_number,
    make: data.make,
    model: data.model,
    year: data.year,
    description: data.description
  };
};

export const updateAsset = async (assetId, updates) => {
  const docRef = doc(db, 'assets', assetId);
  const dbUpdates = {
    name: updates.name,
    type: updates.type,
    registration_number: updates.registrationNumber,
    make: updates.make,
    model: updates.model,
    year: updates.year,
    description: updates.description
  };
  await updateDoc(docRef, dbUpdates);

  // Return transformed data (camelCase)
  return {
    id: assetId,
    name: updates.name,
    type: updates.type,
    registrationNumber: updates.registrationNumber,
    make: updates.make,
    model: updates.model,
    year: updates.year,
    description: updates.description
  };
};

export const deleteAsset = async (assetId) => {
  await deleteDoc(doc(db, 'assets', assetId));
};

// ==================== JOB CARDS ====================

export const fetchJobCards = async (userId) => {
  const q = query(
    collection(db, 'jobcards'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  );
  const querySnapshot = await getDocs(q);

  const jobCards = [];
  for (const docSnap of querySnapshot.docs) {
    const jcData = docSnap.data();
    const jobCardId = docSnap.id;

    // Fetch items for this job card
    const itemsQuery = query(
      collection(db, 'jobcardItems'),
      where('jobCardId', '==', jobCardId)
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    const items = itemsSnapshot.docs.map(item => ({
      stockId: item.data().stock_id,
      quantity: parseFloat(item.data().quantity),
      actualCost: parseFloat(item.data().actual_cost),
      description: item.data().description || ''
    }));

    jobCards.push({
      id: jobCardId,
      title: jcData.title,
      description: jcData.description,
      assetId: jcData.asset_id,
      date: jcData.job_date,
      laborCost: parseFloat(jcData.labor_cost) || 0,
      status: jcData.status,
      costingMethod: jcData.costing_method,
      items
    });
  }

  return jobCards;
};

export const createJobCard = async (jobCardData, userId) => {
  const docRef = doc(collection(db, 'jobcards'));
  const data = {
    user_id: userId,
    asset_id: jobCardData.assetId || null,
    title: jobCardData.title,
    description: jobCardData.description || '',
    job_date: jobCardData.date,
    labor_cost: jobCardData.laborCost || 0,
    status: jobCardData.status || 'draft',
    costing_method: jobCardData.costingMethod || null,
    created_at: new Date().toISOString()
  };
  await setDoc(docRef, data);

  // Insert job card items if any
  if (jobCardData.items && jobCardData.items.length > 0) {
    for (const item of jobCardData.items) {
      const itemRef = doc(collection(db, 'jobcardItems'));
      await setDoc(itemRef, {
        jobCardId: docRef.id,
        user_id: userId,
        stock_id: item.stockId || null,
        quantity: item.quantity,
        actual_cost: item.actualCost || 0,
        description: item.description || '',
        created_at: new Date().toISOString()
      });
    }
  }

  return {
    id: docRef.id,
    title: data.title,
    description: data.description,
    assetId: data.asset_id,
    date: data.job_date,
    laborCost: parseFloat(data.labor_cost),
    status: data.status,
    costingMethod: data.costing_method,
    items: jobCardData.items || []
  };
};

export const updateJobCard = async (jobCardId, updates) => {
  const docRef = doc(db, 'jobcards', jobCardId);
  const dbUpdates = {
    title: updates.title,
    description: updates.description,
    asset_id: updates.assetId,
    job_date: updates.date,
    labor_cost: updates.laborCost,
    status: updates.status,
    costing_method: updates.costingMethod
  };
  await updateDoc(docRef, dbUpdates);

  // Delete existing items
  const itemsQuery = query(collection(db, 'jobcardItems'), where('jobCardId', '==', jobCardId));
  const itemsSnapshot = await getDocs(itemsQuery);
  const batch = writeBatch(db);
  itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  // Insert new items
  if (updates.items && updates.items.length > 0) {
    const user = auth.currentUser;
    for (const item of updates.items) {
      const itemRef = doc(collection(db, 'jobcardItems'));
      await setDoc(itemRef, {
        jobCardId: jobCardId,
        user_id: user.uid,
        stock_id: item.stockId || null,
        quantity: item.quantity,
        actual_cost: item.actualCost || 0,
        description: item.description || '',
        created_at: new Date().toISOString()
      });
    }
  }

  // Return transformed data (camelCase)
  return {
    id: jobCardId,
    title: updates.title,
    description: updates.description,
    assetId: updates.assetId,
    date: updates.date,
    laborCost: parseFloat(updates.laborCost) || 0,
    status: updates.status,
    costingMethod: updates.costingMethod,
    items: updates.items || []
  };
};

export const deleteJobCard = async (jobCardId) => {
  // Delete items first
  const itemsQuery = query(collection(db, 'jobcardItems'), where('jobCardId', '==', jobCardId));
  const itemsSnapshot = await getDocs(itemsQuery);
  const batch = writeBatch(db);
  itemsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  await deleteDoc(doc(db, 'jobcards', jobCardId));
};

// ==================== BULK OPERATIONS ====================

export const loadAllUserData = async (userId) => {
  try {
    const [suppliers, stock, assets, jobCards, settings] = await Promise.all([
      fetchSuppliers(userId),
      fetchStock(userId),
      fetchAssets(userId),
      fetchJobCards(userId),
      getSettings(userId)
    ]);

    return {
      suppliers,
      stock,
      assets,
      jobCards,
      settings
    };
  } catch (error) {
    console.error('Error loading user data:', error);
    throw error;
  }
};

export const exportAllData = async (userId) => {
  const data = await loadAllUserData(userId);
  const profile = await getProfile(userId);

  return {
    version: '2.0',
    exportDate: new Date().toISOString(),
    profile,
    ...data
  };
};

export const importUserData = async (userId, importedData) => {
  try {
    // Parse if string
    const data = typeof importedData === 'string' ? JSON.parse(importedData) : importedData;

    // Import suppliers
    if (data.suppliers?.length > 0) {
      for (const s of data.suppliers) {
        const docRef = doc(collection(db, 'suppliers'));
        await setDoc(docRef, {
          user_id: userId,
          name: s.name,
          contact_person: s.contactPerson || '',
          email: s.email || '',
          phone: s.phone || '',
          address: s.address || '',
          notes: s.notes || '',
          created_at: new Date().toISOString()
        });
      }
    }

    // Import assets
    if (data.assets?.length > 0) {
      for (const a of data.assets) {
        const docRef = doc(collection(db, 'assets'));
        await setDoc(docRef, {
          user_id: userId,
          name: a.name,
          type: a.type,
          registration_number: a.registrationNumber || '',
          make: a.make || '',
          model: a.model || '',
          year: a.year || '',
          description: a.description || '',
          created_at: new Date().toISOString()
        });
      }
    }

    // Import stock
    if (data.stock?.length > 0) {
      for (const s of data.stock) {
        const docRef = doc(collection(db, 'stock'));
        await setDoc(docRef, {
          user_id: userId,
          supplier_id: s.supplierId || null,
          name: s.name,
          description: s.description || '',
          part_number: s.partNumber || '',
          category: s.category,
          total_quantity: s.totalQuantity || 0,
          average_cost: s.averageCost || 0,
          created_at: new Date().toISOString()
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Error importing data:', error);
    throw error;
  }
};

export const clearAllData = async (userId) => {
  // Delete job card items
  const itemsQuery = query(collection(db, 'jobcardItems'), where('user_id', '==', userId));
  const itemsSnapshot = await getDocs(itemsQuery);
  for (const doc of itemsSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Delete job cards
  const jobCardsQuery = query(collection(db, 'jobcards'), where('user_id', '==', userId));
  const jobCardsSnapshot = await getDocs(jobCardsQuery);
  for (const doc of jobCardsSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Delete stock usage
  const usageQuery = query(collection(db, 'stock_usage'), where('user_id', '==', userId));
  const usageSnapshot = await getDocs(usageQuery);
  for (const doc of usageSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Delete stock batches
  const batchesQuery = query(collection(db, 'stock_batches'), where('user_id', '==', userId));
  const batchesSnapshot = await getDocs(batchesQuery);
  for (const doc of batchesSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Delete stock
  const stockQuery = query(collection(db, 'stock'), where('user_id', '==', userId));
  const stockSnapshot = await getDocs(stockQuery);
  for (const doc of stockSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Delete assets
  const assetsQuery = query(collection(db, 'assets'), where('user_id', '==', userId));
  const assetsSnapshot = await getDocs(assetsQuery);
  for (const doc of assetsSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Delete suppliers
  const suppliersQuery = query(collection(db, 'suppliers'), where('user_id', '==', userId));
  const suppliersSnapshot = await getDocs(suppliersQuery);
  for (const doc of suppliersSnapshot.docs) {
    await deleteDoc(doc.ref);
  }

  // Reset settings to defaults
  await updateSettings(userId, {
    currency: 'ZAR',
    inventory_method: 'FIFO'
  });
};

// ==================== ALIASES FOR COMPATIBILITY ====================

export const clearAllUserData = clearAllData;
export const exportUserData = exportAllData;
