// --- IMPORT FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// --- CONFIGURATION (PASTE YOUR FIREBASE KEYS HERE) ---
const firebaseConfig = {
    apiKey: "AIzaSyChTXTsCZZxFGZyheznVWlQ_jO8LroXZbY",
    authDomain: "stock-fdfe7.firebaseapp.com",
    projectId: "stock-fdfe7",
    storageBucket: "stock-fdfe7.firebasestorage.app",
    messagingSenderId: "771102774872",
    appId: "1:771102774872:web:c9cb25329927ec71a09c2d",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- GLOBAL VARIABLES ---
let currentUser = "Issam Abahmane";
let gasoilStock = 0;

// Base Data
const baseOilTypes = ["TAIL SEAL GREASE", "PLANTOGEL ECO 2 S", "RENOLIT LX-EP 2", "QUAKERPASTE SC (2)", "QUAKERTEK MOLYBDAL-2", "HYDRAULIC VH68", "XPRO HYPER 10W40", "SUMMER COOLANT C40", "PARCOOL EG", "REDUCT EP 150", "REDUCT EP 320"];
const baseBenTypes = ["SODA ASH", "TUNNEL GEL PLUS", "CLAY CUTTER", "DRILLING BENTONITE-SUPER GEL-X", "DRILLING BENTONITE HYDRAUL EZ", "SUSPEND IT", "CAL", "PAC-L", "TUNNEL LUPE", "CEBO IPR-503", "F-SEAL 20KG/BAG", "FLEUR DE CHAUX"];

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Set default dates
    document.querySelectorAll('input[type="date"]').forEach(i => i.valueAsDate = new Date());
    
    // Listen for User Changes
    document.getElementById('current_user').addEventListener('change', updateHeaderUser);
    updateHeaderUser();

    // Populate Dropdowns
    populateSelect('oil_name', baseOilTypes);
    populateSelect('ben_name', baseBenTypes);

    // --- START REAL-TIME LISTENERS (The Magic Part) ---
    listenToCollection('inventory_oil', renderOil);
    listenToCollection('inventory_ben', renderBen);
    listenToCollection('inventory_stock', renderStock);
    listenToCollection('log_sortie', renderSortie);
    listenToCollection('log_gasoil', renderGasoil);
    listenToCollection('log_activity', renderActivity);
    
    // Listen to Settings (Gasoil Stock)
    onSnapshot(doc(db, "settings", "global_config"), (docSnap) => {
        if (docSnap.exists()) {
            gasoilStock = docSnap.data().gasoilStock || 0;
            document.getElementById('gas_val').textContent = gasoilStock;
            document.getElementById('st-gas').textContent = gasoilStock;
            checkAlerts();
        } else {
            // Create if doesn't exist
            updateDoc(doc(db, "settings", "global_config"), { gasoilStock: 23600 }).catch(() => {});
        }
    });
});

// --- HELPER FUNCTIONS ---
function updateHeaderUser() {
    currentUser = document.getElementById('current_user').value;
    document.getElementById('header_user').textContent = currentUser;
    document.querySelectorAll('.mag-select').forEach(el => {
        el.innerHTML = document.getElementById('current_user').innerHTML;
        el.value = currentUser;
    });
}

function populateSelect(id, items) {
    const sel = document.getElementById(id);
    sel.innerHTML = '';
    items.forEach(i => {
        let opt = document.createElement('option');
        opt.value = i; opt.text = i; sel.add(opt);
    });
}

// --- FIREBASE LISTENERS ---
function listenToCollection(colName, renderCallback) {
    const q = query(collection(db, colName), orderBy("date", "desc"), limit(100));
    onSnapshot(q, (snapshot) => {
        let data = [];
        snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() });
        });
        renderCallback(data);
    });
}

// --- CORE ACTIONS (Save/Edit) ---

// 1. OILS
window.app.saveOil = async function() {
    const id = document.getElementById('oil_id').value;
    const item = {
        type: document.getElementById('oil_name').value,
        qty: parseFloat(document.getElementById('oil_qty').value) || 0,
        unit: document.getElementById('oil_unit').value,
        alert: parseFloat(document.getElementById('oil_alert').value) || 2,
        date: document.getElementById('oil_date').value,
        user: document.getElementById('oil_user').value
    };

    if (id) {
        await updateDoc(doc(db, "inventory_oil", id), item);
        logAction("Modif Huile", item.type);
    } else {
        await addDoc(collection(db, "inventory_oil"), item);
        logAction("Ajout Huile", item.type);
    }
    alert("Enregistré !");
    window.app.resetForm('form-oil');
};

// 2. BENTONITE
window.app.saveBen = async function() {
    const id = document.getElementById('ben_id').value;
    const item = {
        nom: document.getElementById('ben_name').value,
        qty: parseFloat(document.getElementById('ben_qty').value) || 0,
        unit: document.getElementById('ben_unit').value,
        alert: parseFloat(document.getElementById('ben_alert').value) || 50,
        date: document.getElementById('ben_date').value,
        user: document.getElementById('ben_user').value
    };

    if (id) {
        await updateDoc(doc(db, "inventory_ben", id), item);
        logAction("Modif Bentonite", item.nom);
    } else {
        await addDoc(collection(db, "inventory_ben"), item);
        logAction("Ajout Bentonite", item.nom);
    }
    alert("Enregistré !");
    window.app.resetForm('form-ben');
};

// 3. STOCK
window.app.saveStock = async function() {
    const id = document.getElementById('stk_id').value;
    const item = {
        des: document.getElementById('stk_des').value,
        cat: document.getElementById('stk_cat').value,
        qty: parseFloat(document.getElementById('stk_qty').value) || 0,
        loc: document.getElementById('stk_loc').value,
        alert: parseFloat(document.getElementById('stk_alert').value) || 5,
        date: document.getElementById('stk_date').value,
        user: document.getElementById('stk_user').value
    };

    if(!item.des) return alert("Nom requis");

    if (id) {
        await updateDoc(doc(db, "inventory_stock", id), item);
        logAction("Modif Stock", item.des);
    } else {
        await addDoc(collection(db, "inventory_stock"), item);
        logAction("Ajout Stock", item.des);
    }
    alert("Enregistré !");
    window.app.resetForm('form-stock');
};

// 4. SORTIE
window.app.saveSortie = async function() {
    const item = {
        nom: document.getElementById('sort_nom').value,
        qty: parseFloat(document.getElementById('sort_qty').value) || 0,
        dest: document.getElementById('sort_dest').value,
        rec: document.getElementById('sort_rec').value,
        date: document.getElementById('sort_date').value,
        user: document.getElementById('sort_user').value
    };
    await addDoc(collection(db, "log_sortie"), item);
    logAction("Sortie", `${item.qty} ${item.nom} -> ${item.dest}`);
    alert("Validé !");
    window.app.resetForm('form-sortie');
};

// 5. GASOIL
window.app.saveGasoil = async function() {
    const conso = parseFloat(document.getElementById('gas_conso').value) || 0;
    if (conso <= 0) return alert("Quantité invalide");

    const item = {
        date: document.getElementById('gas_date').value,
        time: document.getElementById('gas_time').value,
        mac: document.getElementById('gas_machine').value,
        sh: document.getElementById('gas_shift').value,
        conso: conso,
        user: document.getElementById('gas_user').value
    };

    // 1. Add Log
    await addDoc(collection(db, "log_gasoil"), item);
    // 2. Update Total Stock
    const newStock = gasoilStock - conso;
    await updateDoc(doc(db, "settings", "global_config"), { gasoilStock: newStock });
    
    logAction("Conso Gasoil", `${conso}L - ${item.mac}`);
    alert("Enregistré !");
    window.app.resetForm('form-gasoil');
};

window.app.editGasoilStock = async function() {
    let v = prompt("Entrez le stock réel actuel (Litres):", gasoilStock);
    if(v) {
        await updateDoc(doc(db, "settings", "global_config"), { gasoilStock: parseFloat(v) });
    }
}

// --- LOGGING ---
async function logAction(act, det) {
    const log = {
        date: new Date().toLocaleDateString('fr-FR'),
        time: new Date().toLocaleTimeString('fr-FR'),
        user: currentUser,
        act: act,
        det: det,
        timestamp: Date.now() // For sorting
    };
    await addDoc(collection(db, "log_activity"), log);
}

// --- RENDERERS (Display Data) ---
function renderOil(list) {
    let t = document.querySelector('#table-oil tbody'); t.innerHTML = '';
    list.forEach(i => {
        let st = i.qty <= i.alert ? '<span class="badge badge-low">Bas</span>' : '<span class="badge badge-ok">OK</span>';
        t.innerHTML += `<tr><td>${i.type}</td><td>${i.qty}</td><td>${i.unit}</td><td>${i.alert}</td><td>${i.date}</td><td>${i.user}</td><td class="center">${st}</td><td class="center"><button class="btn-icon btn-edit" onclick="window.app.editOil('${i.id}')"><i class="fas fa-pen"></i></button></td></tr>`;
    });
    document.getElementById('st-oil').textContent = list.length;
    window.currentOilList = list;
}

function renderBen(list) {
    let t = document.querySelector('#table-ben tbody'); t.innerHTML = '';
    list.forEach(i => {
        let st = i.qty <= i.alert ? '<span class="badge badge-low">Bas</span>' : '<span class="badge badge-ok">OK</span>';
        t.innerHTML += `<tr><td>${i.nom}</td><td>${i.qty}</td><td>${i.unit}</td><td>${i.alert}</td><td>${i.date}</td><td>${i.user}</td><td class="center">${st}</td><td class="center"><button class="btn-icon btn-edit" onclick="window.app.editBen('${i.id}')"><i class="fas fa-pen"></i></button></td></tr>`;
    });
    document.getElementById('st-ben').textContent = list.length;
    window.currentBenList = list;
}

function renderStock(list) {
    let t = document.querySelector('#table-stock tbody'); t.innerHTML = '';
    list.forEach(i => {
        let st = i.qty <= i.alert ? '<span class="badge badge-low">Bas</span>' : '<span class="badge badge-ok">OK</span>';
        t.innerHTML += `<tr><td>${i.des}</td><td>${i.cat}</td><td>${i.loc}</td><td>${i.qty}</td><td>${i.alert}</td><td>${i.date}</td><td>${i.user}</td><td class="center">${st}</td><td class="center"><button class="btn-icon btn-edit" onclick="window.app.editStock('${i.id}')"><i class="fas fa-pen"></i></button></td></tr>`;
    });
    document.getElementById('st-mat').textContent = list.length;
    window.currentStockList = list;
}

function renderSortie(list) {
    let t = document.querySelector('#table-sortie tbody'); t.innerHTML = '';
    list.forEach(i => {
        t.innerHTML += `<tr><td>${i.nom}</td><td>${i.qty}</td><td>${i.dest}</td><td>${i.rec}</td><td>${i.date}</td><td>${i.user}</td></tr>`;
    });
}

function renderGasoil(list) {
    let t = document.querySelector('#table-gasoil tbody'); t.innerHTML = '';
    list.forEach(i => {
        t.innerHTML += `<tr><td>${i.date}</td><td>${i.time}</td><td>${i.mac}</td><td>${i.sh}</td><td>${i.conso}</td><td>${i.user}</td><td class="center"><button class="btn-icon btn-trash" onclick="window.app.deleteLog('log_gasoil','${i.id}')"><i class="fas fa-trash"></i></button></td></tr>`;
    });
}

function renderActivity(list) {
    let t = document.querySelector('#table-act tbody'); t.innerHTML = '';
    // Sort by timestamp desc
    list.sort((a,b) => b.timestamp - a.timestamp).forEach(l => {
        t.innerHTML += `<tr><td>${l.date}</td><td>${l.time}</td><td>${l.user}</td><td>${l.act}</td><td>${l.det}</td></tr>`;
    });
}

// --- EDIT PREPARATION ---
window.app.editOil = function(id) {
    let item = window.currentOilList.find(i => i.id === id);
    document.getElementById('oil_id').value = id;
    document.getElementById('oil_name').value = item.type;
    document.getElementById('oil_qty').value = item.qty;
    document.getElementById('oil_unit').value = item.unit;
    document.getElementById('oil_alert').value = item.alert;
    document.getElementById('oil_date').value = item.date;
    document.getElementById('form-oil').scrollIntoView({behavior:'smooth'});
}

window.app.editBen = function(id) {
    let item = window.currentBenList.find(i => i.id === id);
    document.getElementById('ben_id').value = id;
    document.getElementById('ben_name').value = item.nom;
    document.getElementById('ben_qty').value = item.qty;
    document.getElementById('ben_unit').value = item.unit;
    document.getElementById('ben_alert').value = item.alert;
    document.getElementById('ben_date').value = item.date;
    document.getElementById('form-ben').scrollIntoView({behavior:'smooth'});
}

window.app.editStock = function(id) {
    let item = window.currentStockList.find(i => i.id === id);
    document.getElementById('stk_id').value = id;
    document.getElementById('stk_des').value = item.des;
    document.getElementById('stk_cat').value = item.cat;
    document.getElementById('stk_qty').value = item.qty;
    document.getElementById('stk_loc').value = item.loc;
    document.getElementById('stk_alert').value = item.alert;
    document.getElementById('stk_date').value = item.date;
    document.getElementById('form-stock').scrollIntoView({behavior:'smooth'});
}

window.app.deleteLog = async function(col, id) {
    if(confirm("Supprimer cette entrée ?")) {
        await deleteDoc(doc(db, col, id));
        // Note: For gasoil, this simplifies logic by not refunding stock automatically to avoid errors. 
        // Manually adjust stock if needed.
    }
}

// --- UTILITIES ---
window.app.nav = function(id, el) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
    el.classList.add('active');
    document.getElementById('page-title').textContent = el.innerText;
}

window.app.resetForm = function(id) {
    document.getElementById(id).reset();
    document.querySelectorAll('input[type="hidden"]').forEach(i => i.value = '');
    updateHeaderUser();
}

window.app.exportTable = function(id, name) {
    let t = document.getElementById(id);
    let html = t.outerHTML.replace(/ /g, '%20');
    let a = document.createElement('a');
    a.href = 'data:application/vnd.ms-excel,' + html;
    a.download = name + '.xls';
    a.click();
}

window.app.addNewProduct = function(type) {
    let val = prompt("Nouveau Nom du Produit:");
    if(val) {
        let sel = document.getElementById(type === 'oil' ? 'oil_name' : 'ben_name');
        let opt = document.createElement('option');
        opt.value = val.toUpperCase();
        opt.text = val.toUpperCase();
        sel.add(opt);
        sel.value = val.toUpperCase();
    }
}

function checkAlerts() {
    let div = document.getElementById('dash-alerts'); 
    div.innerHTML = ''; 
    if(gasoilStock < 20000) {
        div.innerHTML += `<div class="alert-box"><i class="fas fa-exclamation-triangle"></i> Gasoil Critique (${gasoilStock}L)</div>`;
    }
}

// Expose app functions to window so HTML onclick works
window.app = window.app || {};
