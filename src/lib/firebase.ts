import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, setDoc, getDoc } from 'firebase/firestore';
import * as LocalStorage from './storage';

// Firebase configuration - Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyChTXTsCZZxFGZyheznVWlQ_jO8LroXZbY",
  authDomain: "stock-fdfe7.firebaseapp.com",
  projectId: "stock-fdfe7",
  storageBucket: "stock-fdfe7.firebasestorage.app",
  messagingSenderId: "771102774872",
  appId: "1:771102774872:web:c9cb25329927ec71a09c2d"
};

// Check if Firebase is properly configured
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_API_KEY_HERE";

// Initialize Firebase only if configured
let app: any;
let db: any;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization error:', error);
    db = null;
  }
} else {
  console.warn('🔧 Firebase not configured. Using localStorage demo mode.');
  console.warn('📝 To use Firebase, update the config in /lib/firebase.ts');
  db = null;
  LocalStorage.initializeStorage();
}

export { db };

// Collection references
export const collections = {
  inventoryOil: 'eurohinca_inventory_oil',
  inventoryBen: 'eurohinca_inventory_ben',
  inventoryStock: 'eurohinca_inventory_stock',
  logGasoil: 'eurohinca_log_gasoil',
  logSortie: 'eurohinca_log_sortie',
  logActivity: 'eurohinca_log_activity',
  lists: 'lists'
};

// Helper function to log activity
export async function logActivity(action: string, details: string, user: string) {
  if (!db) {
    LocalStorage.logActivity(action, details, user);
    return;
  }

  try {
    await addDoc(collection(db, 'log_activity'), {
      action,
      details,
      user,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('fr-FR'),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Fallback to localStorage
    LocalStorage.logActivity(action, details, user);
  }
}

// Get list items from lists collection
export async function getListItems(listName: string): Promise<string[]> {
  if (!db) {
    return LocalStorage.getListItems(listName);
  }

  try {
    const docRef = doc(db, 'lists', listName);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.items || [];
    }
    return [];
  } catch (error) {
    console.error(`Error getting ${listName}:`, error);
    return LocalStorage.getListItems(listName);
  }
}

// Add item to list
export async function addListItem(listName: string, item: string) {
  if (!db) {
    LocalStorage.addListItem(listName, item);
    return;
  }

  try {
    const docRef = doc(db, 'lists', listName);
    const docSnap = await getDoc(docRef);
    
    let items: string[] = [];
    if (docSnap.exists()) {
      items = docSnap.data().items || [];
    }
    
    if (!items.includes(item)) {
      items.push(item);
      await setDoc(docRef, { items }, { merge: true });
    }
  } catch (error) {
    console.error(`Error adding to ${listName}:`, error);
    LocalStorage.addListItem(listName, item);
  }
}

// Initialize default lists if they don't exist
export async function initializeDefaultLists() {
  if (!db) {
    LocalStorage.initializeStorage();
    return;
  }

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

  try {
    // Initialize chemicals list
    const chemicalsRef = doc(db, 'lists', 'list_chemicals');
    const chemicalsSnap = await getDoc(chemicalsRef);
    if (!chemicalsSnap.exists()) {
      await setDoc(chemicalsRef, { items: defaultChemicals });
    }

    // Initialize machines list
    const machinesRef = doc(db, 'lists', 'list_machines');
    const machinesSnap = await getDoc(machinesRef);
    if (!machinesSnap.exists()) {
      await setDoc(machinesRef, { items: defaultMachines });
    }

    // Initialize oils list if not exists
    const oilsRef = doc(db, 'lists', 'list_oils');
    const oilsSnap = await getDoc(oilsRef);
    if (!oilsSnap.exists()) {
      await setDoc(oilsRef, { items: [] });
    }

    // Initialize categories list if not exists
    const catsRef = doc(db, 'lists', 'list_cats');
    const catsSnap = await getDoc(catsRef);
    if (!catsSnap.exists()) {
      await setDoc(catsRef, { items: [] });
    }
  } catch (error) {
    console.error('Error initializing default lists:', error);
    LocalStorage.initializeStorage();
  }
}

// Diesel stock management
export async function getDieselStock(): Promise<number> {
  if (!db) {
    return LocalStorage.getDieselStock();
  }

  try {
    const docRef = doc(db, 'lists', 'diesel_stock');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().total || 0;
    }
    return 0;
  } catch (error) {
    console.error('Error getting diesel stock:', error);
    return LocalStorage.getDieselStock();
  }
}

export async function updateDieselStock(amount: number) {
  if (!db) {
    LocalStorage.setDieselStock(amount);
    return;
  }

  try {
    const docRef = doc(db, 'lists', 'diesel_stock');
    await setDoc(docRef, { total: amount }, { merge: true });
  } catch (error) {
    console.error('Error updating diesel stock:', error);
    LocalStorage.setDieselStock(amount);
  }
}

export async function subtractDieselStock(amount: number) {
  if (!db) {
    return LocalStorage.subtractDieselStock(amount);
  }

  try {
    const docRef = doc(db, 'lists', 'diesel_stock');
    const docSnap = await getDoc(docRef);
    
    let currentStock = 0;
    if (docSnap.exists()) {
      currentStock = docSnap.data().total || 0;
    }
    
    const newStock = currentStock - amount;
    await setDoc(docRef, { total: newStock }, { merge: true });
    
    return newStock;
  } catch (error) {
    console.error('Error subtracting diesel stock:', error);
    return LocalStorage.subtractDieselStock(amount);
  }
}

// Firestore wrapper functions that fallback to localStorage
export const firestoreWrapper = {
  async getCollection(collectionName: string): Promise<any[]> {
    if (!db) {
      return LocalStorage.getCollection(collectionName);
    }

    try {
      const snapshot = await getDocs(collection(db, collectionName));
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error getting collection ${collectionName}:`, error);
      return LocalStorage.getCollection(collectionName);
    }
  },

  async addDoc(collectionName: string, data: any): Promise<string> {
    if (!db) {
      return LocalStorage.addToCollection(collectionName, data);
    }

    try {
      const docRef = await addDoc(collection(db, collectionName), data);
      return docRef.id;
    } catch (error) {
      console.error(`Error adding to ${collectionName}:`, error);
      return LocalStorage.addToCollection(collectionName, data);
    }
  },

  async updateDoc(collectionName: string, id: string, data: any): Promise<void> {
    if (!db) {
      LocalStorage.updateInCollection(collectionName, id, data);
      return;
    }

    try {
      await updateDoc(doc(db, collectionName, id), data);
    } catch (error) {
      console.error(`Error updating ${collectionName}/${id}:`, error);
      LocalStorage.updateInCollection(collectionName, id, data);
    }
  },

  async deleteDoc(collectionName: string, id: string): Promise<void> {
    if (!db) {
      LocalStorage.deleteFromCollection(collectionName, id);
      return;
    }

    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error(`Error deleting ${collectionName}/${id}:`, error);
      LocalStorage.deleteFromCollection(collectionName, id);
    }
  }
};