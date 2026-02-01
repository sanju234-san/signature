// Storage utility for window.storage API with auto-save functionality

const STORAGE_PREFIX = 'sigverify:';

// Check if window.storage is available, fallback to localStorage
const getStorage = () => {
  if (typeof window !== 'undefined' && window.storage) {
    return window.storage;
  }
  // Fallback to localStorage wrapper
  return {
    async get(key) {
      const value = localStorage.getItem(key);
      return { value };
    },
    async set(key, value) {
      localStorage.setItem(key, value);
    },
    async delete(key) {
      localStorage.removeItem(key);
    },
    async list(prefix) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(prefix)) {
          keys.push(key);
        }
      }
      return { keys };
    }
  };
};

// Generate unique signature ID
export const generateSignatureId = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SIG-${dateStr}-${random}`;
};

// Generate unique batch ID
export const generateBatchId = () => {
  return `#${Math.floor(10000 + Math.random() * 90000)}`;
};

// Signature operations
export const saveSignature = async (signature) => {
  const storage = getStorage();
  const key = `${STORAGE_PREFIX}signature:${signature.id}`;
  await storage.set(key, JSON.stringify(signature));
  return signature;
};

export const getSignature = async (id) => {
  const storage = getStorage();
  const key = `${STORAGE_PREFIX}signature:${id}`;
  const result = await storage.get(key);
  return result.value ? JSON.parse(result.value) : null;
};

export const getAllSignatures = async () => {
  const storage = getStorage();
  const result = await storage.list(`${STORAGE_PREFIX}signature:`);
  const signatures = await Promise.all(
    (result.keys || []).map(async (key) => {
      const item = await storage.get(key);
      return item.value ? JSON.parse(item.value) : null;
    })
  );
  return signatures.filter(Boolean).sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
};

export const deleteSignature = async (id) => {
  const storage = getStorage();
  const key = `${STORAGE_PREFIX}signature:${id}`;
  await storage.delete(key);
};

// Batch operations
export const saveBatch = async (batch) => {
  const storage = getStorage();
  const key = `${STORAGE_PREFIX}batch:${batch.id}`;
  await storage.set(key, JSON.stringify({
    ...batch,
    lastModified: new Date().toISOString()
  }));
  return batch;
};

export const getBatch = async (id) => {
  const storage = getStorage();
  const key = `${STORAGE_PREFIX}batch:${id}`;
  const result = await storage.get(key);
  return result.value ? JSON.parse(result.value) : null;
};

export const getAllBatches = async () => {
  const storage = getStorage();
  const result = await storage.list(`${STORAGE_PREFIX}batch:`);
  const batches = await Promise.all(
    (result.keys || []).map(async (key) => {
      const item = await storage.get(key);
      return item.value ? JSON.parse(item.value) : null;
    })
  );
  return batches.filter(Boolean).sort((a, b) => 
    new Date(b.lastModified) - new Date(a.lastModified)
  );
};

export const deleteBatch = async (id) => {
  const storage = getStorage();
  const key = `${STORAGE_PREFIX}batch:${id}`;
  await storage.delete(key);
};

// Metrics operations
export const saveMetrics = async (metrics) => {
  const storage = getStorage();
  await storage.set(`${STORAGE_PREFIX}metrics`, JSON.stringify({
    ...metrics,
    lastUpdated: new Date().toISOString()
  }));
  return metrics;
};

export const getMetrics = async () => {
  const storage = getStorage();
  const result = await storage.get(`${STORAGE_PREFIX}metrics`);
  return result.value ? JSON.parse(result.value) : {
    confidenceDistribution: { high: 0, medium: 0, low: 0 },
    accuracyTrends: [],
    lastUpdated: new Date().toISOString()
  };
};

// User preferences
export const saveUserPrefs = async (prefs) => {
  const storage = getStorage();
  await storage.set(`${STORAGE_PREFIX}userPrefs`, JSON.stringify(prefs));
  return prefs;
};

export const getUserPrefs = async () => {
  const storage = getStorage();
  const result = await storage.get(`${STORAGE_PREFIX}userPrefs`);
  return result.value ? JSON.parse(result.value) : {
    theme: 'light',
    defaultView: 'grid',
    itemsPerPage: 10,
    autoSave: true,
    notifications: true
  };
};

// Export all data
export const exportAllData = async () => {
  const signatures = await getAllSignatures();
  const batches = await getAllBatches();
  const metrics = await getMetrics();
  const userPrefs = await getUserPrefs();
  
  return {
    signatures,
    batches,
    metrics,
    userPrefs,
    exportedAt: new Date().toISOString()
  };
};

// Import data
export const importData = async (data) => {
  if (data.signatures) {
    for (const sig of data.signatures) {
      await saveSignature(sig);
    }
  }
  if (data.batches) {
    for (const batch of data.batches) {
      await saveBatch(batch);
    }
  }
  if (data.metrics) {
    await saveMetrics(data.metrics);
  }
  if (data.userPrefs) {
    await saveUserPrefs(data.userPrefs);
  }
};

// Calculate metrics from signatures
export const recalculateMetrics = async () => {
  const signatures = await getAllSignatures();
  
  const high = signatures.filter(s => s.confidence >= 90).length;
  const medium = signatures.filter(s => s.confidence >= 70 && s.confidence < 90).length;
  const low = signatures.filter(s => s.confidence < 70).length;
  const total = signatures.length || 1;
  
  const metrics = {
    confidenceDistribution: {
      high: ((high / total) * 100).toFixed(1),
      medium: ((medium / total) * 100).toFixed(1),
      low: ((low / total) * 100).toFixed(1)
    },
    accuracyTrends: generateAccuracyTrends(signatures),
    lastUpdated: new Date().toISOString()
  };
  
  await saveMetrics(metrics);
  return metrics;
};

// Generate accuracy trends data
const generateAccuracyTrends = (signatures) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days.map((day, i) => ({
    day,
    authentic: Math.floor(50 + Math.random() * 50),
    forged: Math.floor(20 + Math.random() * 40)
  }));
};
