// LocalStorage adapter for demo mode when Firebase is not configured

const STORAGE_KEYS = {
  inventoryOil: 'eurohinca_inventory_oil',
  inventoryBen: 'eurohinca_inventory_ben',
  inventoryStock: 'eurohinca_inventory_stock',
  logGasoil: 'eurohinca_log_gasoil',
  logSortie: 'eurohinca_log_sortie',
  logActivity: 'eurohinca_log_activity',
  lists: 'eurohinca_lists',
  dieselStock: 'eurohinca_diesel_stock'
};

// Default data
const defaultChemicals = [
  'SODA ASH',
  'TUNNEL GEL PLUS',
  'CLAY CUTTER',
  'DRILLING BENTONITE-SUPER GEL-X',
  'HYDRAULIC EZ',
  'SWELL WELL SW150',
  'SUSPEND IT',
  'CAL',
  'PAC-L',
  'TUNNEL LUPE',
  'CEBO IPR-503',
  'F-SEAL 20KG/BAG'
];

const defaultMachines = [
  'CRANE 7737-B-50',
  'MANITOU',
  'TRUCK',
  'TGCC',
  'ATLAS COPCO',
  'HIMOINSA',
  'EXPRESS SAFI',
  'EXPRESS CASABLANCA',
  'MUTSHIBISHI CASABLANCA',
  'CAMION'
];

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
}

// Initialize default lists
export function initializeStorage() {
  const lists = getFromStorage(STORAGE_KEYS.lists, {
    list_chemicals: defaultChemicals,
    list_machines: defaultMachines,
    list_oils: [],
    list_cats: []
  });
  setToStorage(STORAGE_KEYS.lists, lists);

  // Initialize diesel stock if not exists
  if (localStorage.getItem(STORAGE_KEYS.dieselStock) === null) {
    setToStorage(STORAGE_KEYS.dieselStock, 0);
  }
}

// Collection operations
export function getCollection(collectionName: string): any[] {
  return getFromStorage(collectionName, []);
}

export function addToCollection(collectionName: string, data: any): string {
  const collection = getCollection(collectionName);
  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  collection.push({ id, ...data });
  setToStorage(collectionName, collection);
  return id;
}

export function updateInCollection(collectionName: string, id: string, data: any): void {
  const collection = getCollection(collectionName);
  const index = collection.findIndex(item => item.id === id);
  if (index !== -1) {
    collection[index] = { ...collection[index], ...data };
    setToStorage(collectionName, collection);
  }
}

export function deleteFromCollection(collectionName: string, id: string): void {
  let collection = getCollection(collectionName);
  collection = collection.filter(item => item.id !== id);
  setToStorage(collectionName, collection);
}

// List operations
export function getListItems(listName: string): string[] {
  const lists = getFromStorage(STORAGE_KEYS.lists, {});
  return lists[listName] || [];
}

export function addListItem(listName: string, item: string): void {
  const lists = getFromStorage(STORAGE_KEYS.lists, {});
  if (!lists[listName]) {
    lists[listName] = [];
  }
  if (!lists[listName].includes(item)) {
    lists[listName].push(item);
    setToStorage(STORAGE_KEYS.lists, lists);
  }
}

// Diesel stock operations
export function getDieselStock(): number {
  return getFromStorage(STORAGE_KEYS.dieselStock, 0);
}

export function setDieselStock(amount: number): void {
  setToStorage(STORAGE_KEYS.dieselStock, amount);
}

export function subtractDieselStock(amount: number): number {
  const current = getDieselStock();
  const newStock = current - amount;
  setDieselStock(newStock);
  return newStock;
}

// Activity log
export function logActivity(action: string, details: string, user: string): void {
  addToCollection(STORAGE_KEYS.logActivity, {
    action,
    details,
    user,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('fr-FR'),
    timestamp: new Date().toISOString()
  });
}

// Export storage keys for use in components
export { STORAGE_KEYS };
