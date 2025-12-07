import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, limit, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// --- PASTE YOUR CONFIG HERE ---
const firebaseConfig = {
    apiKey: "AIzaSyChTXTsCZZxFGZyheznVWlQ_jO8LroXZbY",

    authDomain: "stock-fdfe7.firebaseapp.com",

    projectId: "stock-fdfe7",

    storageBucket: "stock-fdfe7.firebasestorage.app",

    messagingSenderId: "771102774872",

    appId: "1:771102774872:web:c9cb25329927ec71a09c2d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// GLOBAL STATE
let currentUser = null;
let gasoilStock = 0;
window.currentData = {}; // Stores lists for editing

document.addEventListener('DOMContentLoaded', () => {
    // 1. Navigation Logic (Fixed)
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.getElementById('page-title');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            menuItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));
            
            // Add active to clicked
            item.classList.add('active');
            const targetId = item.getAttribute('data-target');
            document.getElementById(targetId).classList.remove('hidden');
            pageTitle.textContent = item.innerText;
        });
    });

    // 2. Login Logic
    document.getElementById('btn-login-submit').addEventListener('click', () => {
        const user = document.getElementById('login-user').value;
        if(!user) return alert("Sélectionnez un nom");
        
        currentUser = user;
        document.getElementById('current-user-display').textContent = currentUser;
        
        // Hide Login, Show App
        document.getElementById('login-screen').style.opacity = '0';
        setTimeout(() => document.getElementById('login-screen').classList.add('hidden'), 500);
        
        // Start Listeners only after login
        startAppListeners();
    });

    // 3. Seeder (Your Lists)
    document.getElementById('btn-seed').addEventListener('click', seedDatabase);

    // 4. Set Dates
    document.querySelectorAll('input[type="date"]').forEach(i => i.valueAsDate = new Date());
});

// --- LISTENER START ---
function startAppListeners() {
    // Inventory
    listenToCol('inventory_oil', renderOil);
    listenToCol('inventory_ben', renderBen);
    listenToCol('inventory_stock', renderStock);
    listenToCol('log_gasoil', renderGasoil);
    listenToCol('log_sortie', renderSortie);
    listenToCol('log_activity', renderActivity);

    // Settings (Gasoil Stock)
    onSnapshot(doc(db, "settings", "global_config"), (s) => {
        if(s.exists()) {
            gasoilStock = s.data().gasoilStock || 0;
            document.getElementById('gas_val').textContent = gasoilStock;
            document.getElementById('st-gas').textContent = gasoilStock;
        }
    });

    // Dynamic Lists (The + Button Data)
    listenToDropdown('list_oils', 'oil_name');
    listenToDropdown('list_chemicals', 'ben_name');
    listenToDropdown('list_machines', 'gas_machine');
    listenToDropdown('list_cats', 'stk_cat');
}

// --- DATABASE FUNCTIONS ---

// 1. DYNAMIC LISTS (Your Request)
async function seedDatabase() {
    if(!confirm("Cela va écraser les listes par défaut. Continuer ?")) return;

    // A. CHEMICALS
    const chemicals = [
        "SODA ASH", "TUNNEL GEL PLUS", "CLAY CUTTER", "DRILLING BENTONITE-SUPER GEL-X",
        "DRILLING BENTONITE HYDRAUL EZ", "DRILLING BENTONITE SWELL WELL SW150",
        "SUSPEND IT", "CAL", "PAC-L", "TUNNEL LUPE", "CEBO IPR-503", "F-SEAL 20KG/BAG"
    ];
    await setDoc(doc(db, "lists", "list_chemicals"), { items: chemicals });

    // B. MACHINES
    const machines = [
        "CRANE 7737-B-50", "MANITOU", "TRUCK", "TGCC", "ATLAS COPCO",
        "HIMOINSA", "EXPRESS SAFI", "EXPRESS CASABLANCA", "MUTSHIBISHI CASABLANCA", "CAMION"
    ];
    await setDoc(doc(db, "lists", "list_machines"), { items: machines });

    // C. OILS (Default)
    const oils = ["HYDRAULIC 68", "TAIL SEAL GREASE", "EP2 GREASE", "15W40 ENGINE"];
    await setDoc(doc(db, "lists", "list_oils"), { items: oils });

    // D. CATEGORIES
    const cats = ["Mécanique", "Electrique", "Levage", "Soudage", "EPI"];
    await setDoc(doc(db, "lists", "list_cats"), { items: cats });

    alert("Listes mises à jour avec succès !");
}

function listenToDropdown(docName, selectId) {
    onSnapshot(doc(db, "lists", docName), (snap) => {
        if(snap.exists()) {
            const items = snap.data().items || [];
            const sel = document.getElementById(selectId);
            sel.innerHTML = '';
            items.sort().forEach(i => {
                let opt = document.createElement('option');
                opt.value = i; opt.text = i; sel.add(opt);
            });
        }
    });
}

window.app.addDynamicItem = async function(docName, selectId) {
    const val = prompt("Nouveau nom à ajouter :");
    if(!val) return;
    
    const docRef = doc(db, "lists", docName);
    const snap = await getDoc(docRef);
    let items = [];
    if(snap.exists()) items = snap.data().items;
    
    if(!items.includes(val.toUpperCase())) {
        items.push(val.toUpperCase());
        await setDoc(docRef, { items: items }); // Updates DB, Listener updates UI
    }
};

// 2. SAVING DATA
window.app.saveOil = async () => saveGeneric('inventory_oil', 'oil', 'type', 'oil_name');
window.app.saveBen = async () => saveGeneric('inventory_ben', 'ben', 'nom', 'ben_name');
window.app.saveStock = async () => {
    // Custom for stock because fields are different
    const id = document.getElementById('stk_id').value;
    const item = {
        des: val('stk_des'), cat: val('stk_cat'), qty: num('stk_qty'),
        loc: val('stk_loc'), alert: num('stk_alert'), user: currentUser,
        date: new Date().toISOString().split('T')[0]
    };
    if(!item.des) return alert("Erreur");
    await handleDbSave('inventory_stock', id, item, "Stock", item.des);
    window.app.resetForm('form-stock');
}

window.app.saveSortie = async () => {
    const item = {
        nom: val('sort_nom'), qty: num('sort_qty'), dest: val('sort_dest'),
        rec: val('sort_rec'), user: currentUser, date: new Date().toISOString()
    };
    await addDoc(collection(db, 'log_sortie'), item);
    logAction("Sortie", `${item.qty} ${item.nom}`);
    alert("Sortie Validée");
    window.app.resetForm('form-sortie');
}

window.app.saveGasoil = async () => {
    const c = num('gas_conso');
    if(c <= 0) return alert("Erreur Conso");
    const item = {
        mac: val('gas_machine'), sh: val('gas_shift'), conso: c,
        date: val('gas_date'), time: val('gas_time'), user: currentUser
    };
    await addDoc(collection(db, 'log_gasoil'), item);
    await updateDoc(doc(db, "settings", "global_config"), { gasoilStock: gasoilStock - c });
    logAction("Gasoil", `${c}L - ${item.mac}`);
    alert("Enregistré");
    window.app.resetForm('form-gasoil');
}

window.app.editGasoilStock = async () => {
    const n = prompt("Nouveau stock réel :", gasoilStock);
    if(n) await updateDoc(doc(db, "settings", "global_config"), { gasoilStock: parseFloat(n) });
}

// 3. HELPERS
async function saveGeneric(col, prefix, nameField, nameId) {
    const id = document.getElementById(prefix+'_id').value;
    const item = {
        [nameField]: val(nameId),
        qty: num(prefix+'_qty'),
        unit: val(prefix+'_unit'),
        alert: num(prefix+'_alert'),
        user: currentUser,
        date: new Date().toISOString().split('T')[0]
    };
    if(!item[nameField]) return alert("Nom manquant");
    await handleDbSave(col, id, item, prefix.toUpperCase(), item[nameField]);
    window.app.resetForm('form-'+prefix);
}

async function handleDbSave(col, id, item, type, name) {
    if(id) {
        await updateDoc(doc(db, col, id), item);
        logAction(`Modif ${type}`, name);
    } else {
        await addDoc(collection(db, col), item);
        logAction(`Ajout ${type}`, name);
    }
    alert("Succès");
}

function listenToCol(col, cb) {
    const q = query(collection(db, col), orderBy(col.includes('log')?'date':'qty', 'desc'), limit(50));
    onSnapshot(q, (snap) => {
        let l = []; snap.forEach(d => l.push({id: d.id, ...d.data()}));
        window.currentData[col] = l;
        cb(l);
    });
}

function logAction(act, det) {
    addDoc(collection(db, 'log_activity'), {
        date: new Date().toLocaleDateString(), time: new Date().toLocaleTimeString(),
        user: currentUser, act: act, det: det, timestamp: Date.now()
    });
}

// 4. RENDERERS
function renderOil(l) { renderTable('table-oil', l, ['type','qty','unit','alert','date','user'], 'inventory_oil'); document.getElementById('st-oil').innerText = l.length; }
function renderBen(l) { renderTable('table-ben', l, ['nom','qty','unit','alert','date','user'], 'inventory_ben'); document.getElementById('st-ben').innerText = l.length; }
function renderStock(l) {
    const t = document.querySelector('#table-stock tbody'); t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.des}</td><td>${i.cat}</td><td>${i.loc}</td><td>${i.qty}</td><td>${i.alert}</td><td class="center"><button class="btn-plus" onclick="window.app.editItem('inventory_stock','${i.id}')"><i class="fas fa-pen"></i></button></td></tr>`);
    document.getElementById('st-mat').innerText = l.length;
}
function renderSortie(l) {
    const t = document.querySelector('#table-sortie tbody'); t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.nom}</td><td>${i.qty}</td><td>${i.dest}</td><td>${i.rec}</td><td>${i.date.slice(0,10)}</td><td>${i.user}</td></tr>`);
}
function renderGasoil(l) {
    const t = document.querySelector('#table-gasoil tbody'); t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.date}</td><td>${i.time}</td><td>${i.mac}</td><td>${i.sh}</td><td>${i.conso}</td><td>${i.user}</td><td><i class="fas fa-check" style="color:green;"></i></td></tr>`);
}
function renderActivity(l) {
    const t = document.querySelector('#table-act tbody'); t.innerHTML = '';
    l.sort((a,b)=>b.timestamp-a.timestamp).forEach(i => t.innerHTML += `<tr><td>${i.date}</td><td>${i.time}</td><td>${i.user}</td><td>${i.act}</td><td>${i.det}</td></tr>`);
}

function renderTable(tid, list, keys, col) {
    const t = document.querySelector(`#${tid} tbody`); t.innerHTML = '';
    list.forEach(i => {
        let row = '<tr>';
        keys.forEach(k => row += `<td>${i[k]||''}</td>`);
        let badge = (i.qty <= i.alert) ? '<span style="color:red; font-weight:bold;">BAS</span>' : '<span style="color:green;">OK</span>';
        row += `<td><div style="display:flex; align-items:center; gap:10px;">${badge} <button class="btn-plus" style="width:30px; height:30px;" onclick="window.app.editItem('${col}','${i.id}')"><i class="fas fa-pen"></i></button></div></td></tr>`;
        t.innerHTML += row;
    });
}

// 5. UTILS
window.app.editItem = (col, id) => {
    const item = window.currentData[col].find(x => x.id === id);
    if(col === 'inventory_oil') { fill('oil', id, item, 'type'); }
    if(col === 'inventory_ben') { fill('ben', id, item, 'nom'); }
    if(col === 'inventory_stock') {
        document.getElementById('stk_id').value = id;
        document.getElementById('stk_des').value = item.des;
        document.getElementById('stk_cat').value = item.cat;
        document.getElementById('stk_qty').value = item.qty;
        document.getElementById('stk_loc').value = item.loc;
        document.getElementById('stk_alert').value = item.alert;
    }
}
function fill(p, id, item,
