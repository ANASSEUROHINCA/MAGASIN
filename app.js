import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, limit, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// 1. Initialize global object first
window.app = {};

// 2. Your Configuration
const firebaseConfig = {
    apiKey: "AIzaSyChTXTsCZZxFGZyheznVWlQ_jO8LroXZbY",
    authDomain: "stock-fdfe7.firebaseapp.com",
    projectId: "stock-fdfe7",
    storageBucket: "stock-fdfe7.firebasestorage.app",
    messagingSenderId: "771102774872",
    appId: "1:771102774872:web:c9cb25329927ec71a09c2d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Global Variables
let currentUser = null;
let gasoilStock = 0;
window.currentData = {};

document.addEventListener('DOMContentLoaded', () => {
    console.log("App Started");

    // Login Handler
    const loginBtn = document.getElementById('btn-login-submit');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            const user = document.getElementById('login-user').value;
            if (!user || user === "") return alert("Veuillez sélectionner un utilisateur.");
            
            currentUser = user;
            document.getElementById('current-user-display').textContent = currentUser;
            
            // Hide Login
            const screen = document.getElementById('login-screen');
            screen.style.opacity = '0';
            setTimeout(() => screen.style.display = 'none', 500);
            
            // Start App
            startAppListeners();
        });
    }

    // Navigation Handler
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.section');
    const title = document.getElementById('page-title');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            if(!currentUser) return; // Prevent nav if not logged in
            
            menuItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));
            
            item.classList.add('active');
            const target = document.getElementById(item.dataset.target);
            if(target) {
                target.classList.remove('hidden');
                title.textContent = item.innerText;
            }
        });
    });

    // Seed Button
    const seedBtn = document.getElementById('btn-seed');
    if(seedBtn) seedBtn.addEventListener('click', seedDatabase);

    // Default Dates
    document.querySelectorAll('input[type="date"]').forEach(i => i.valueAsDate = new Date());
});

function startAppListeners() {
    listenToCol('inventory_oil', renderOil);
    listenToCol('inventory_ben', renderBen);
    listenToCol('inventory_stock', renderStock);
    listenToCol('log_gasoil', renderGasoil);
    listenToCol('log_sortie', renderSortie);
    listenToCol('log_activity', renderActivity);

    // Listen to Gasoil Stock Setting
    onSnapshot(doc(db, "settings", "global_config"), (s) => {
        if(s.exists()) {
            gasoilStock = s.data().gasoilStock || 0;
            document.getElementById('gas_val').textContent = gasoilStock;
            document.getElementById('st-gas').textContent = gasoilStock;
        } else {
            setDoc(doc(db, "settings", "global_config"), { gasoilStock: 0 });
        }
    });

    // Listen to Dynamic Lists
    listenToDropdown('list_oils', 'oil_name');
    listenToDropdown('list_chemicals', 'ben_name');
    listenToDropdown('list_machines', 'gas_machine');
    listenToDropdown('list_cats', 'stk_cat');
}

// --- DATABASE OPERATIONS ---

// Seeder
async function seedDatabase() {
    if(!confirm("Charger les listes par défaut ?")) return;
    
    await setDoc(doc(db, "lists", "list_chemicals"), { 
        items: ["SODA ASH", "TUNNEL GEL PLUS", "CLAY CUTTER", "DRILLING BENTONITE-SUPER GEL-X", "DRILLING BENTONITE HYDRAUL EZ", "DRILLING BENTONITE SWELL WELL SW150", "SUSPEND IT", "CAL", "PAC-L", "TUNNEL LUPE", "CEBO IPR-503", "F-SEAL 20KG/BAG"] 
    });
    
    await setDoc(doc(db, "lists", "list_machines"), { 
        items: ["CRANE 7737-B-50", "MANITOU", "TRUCK", "TGCC", "ATLAS COPCO", "HIMOINSA", "EXPRESS SAFI", "EXPRESS CASABLANCA", "MUTSHIBISHI CASABLANCA", "CAMION"] 
    });

    await setDoc(doc(db, "lists", "list_oils"), { 
        items: ["HYDRAULIC 68", "TAIL SEAL GREASE", "EP2 GREASE", "15W40 ENGINE"] 
    });

    await setDoc(doc(db, "lists", "list_cats"), { 
        items: ["Mécanique", "Electrique", "Levage", "Soudage", "EPI"] 
    });
    
    alert("Listes chargées !");
}

// Add Dynamic Item
window.app.addDynamicItem = async function(docName, selectId) {
    const val = prompt("Nouveau nom :");
    if(!val) return;
    const docRef = doc(db, "lists", docName);
    const snap = await getDoc(docRef);
    let items = snap.exists() ? snap.data().items : [];
    
    if(!items.includes(val.toUpperCase())) {
        items.push(val.toUpperCase());
        await setDoc(docRef, { items: items });
    }
};

// Save Functions
window.app.saveOil = async () => saveGeneric('inventory_oil', 'oil', 'type', 'oil_name');
window.app.saveBen = async () => saveGeneric('inventory_ben', 'ben', 'nom', 'ben_name');

window.app.saveStock = async () => {
    const id = val('stk_id');
    const item = {
        des: val('stk_des'), cat: val('stk_cat'), qty: num('stk_qty'),
        loc: val('stk_loc'), alert: num('stk_alert'), user: currentUser,
        date: new Date().toISOString().split('T')[0]
    };
    if(!item.des) return alert("Nom requis");
    await handleDbSave('inventory_stock', id, item, "Stock", item.des);
    window.app.resetForm('form-stock');
};

window.app.saveSortie = async () => {
    const item = {
        nom: val('sort_nom'), qty: num('sort_qty'), dest: val('sort_dest'),
        rec: val('sort_rec'), user: currentUser, date: new Date().toISOString()
    };
    await addDoc(collection(db, 'log_sortie'), item);
    logAction("Sortie", `${item.qty} ${item.nom}`);
    alert("Sortie validée");
    window.app.resetForm('form-sortie');
};

window.app.saveGasoil = async () => {
    const c = num('gas_conso');
    if(c <= 0) return alert("Quantité invalide");
    const item = {
        mac: val('gas_machine'), sh: val('gas_shift'), conso: c,
        date: val('gas_date'), time: val('gas_time'), user: currentUser
    };
    await addDoc(collection(db, 'log_gasoil'), item);
    await updateDoc(doc(db, "settings", "global_config"), { gasoilStock: gasoilStock - c });
    logAction("Gasoil", `${c}L - ${item.mac}`);
    alert("Enregistré");
    window.app.resetForm('form-gasoil');
};

window.app.editGasoilStock = async () => {
    const n = prompt("Stock Réel :", gasoilStock);
    if(n) await updateDoc(doc(db, "settings", "global_config"), { gasoilStock: parseFloat(n) });
};

// --- HELPERS ---

async function saveGeneric(col, prefix, nameField, nameId) {
    const id = val(prefix+'_id');
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
}

function listenToCol(col, cb) {
    const q = query(collection(db, col), limit(100));
    onSnapshot(q, (snap) => {
        let l = []; snap.forEach(d => l.push({id: d.id, ...d.data()}));
        window.currentData[col] = l;
        cb(l);
    });
}

function listenToDropdown(docName, selectId) {
    onSnapshot(doc(db, "lists", docName), (snap) => {
        if(snap.exists()) {
            const items = snap.data().items || [];
            const sel = document.getElementById(selectId);
            if(sel) {
                sel.innerHTML = '<option value="">Sélectionnez...</option>';
                items.sort().forEach(i => {
                    let opt = document.createElement('option');
                    opt.value = i; opt.text = i; sel.add(opt);
                });
            }
        }
    });
}

function logAction(act, det) {
    addDoc(collection(db, 'log_activity'), {
        date: new Date().toLocaleDateString('fr-FR'), time: new Date().toLocaleTimeString('fr-FR'),
        user: currentUser, act: act, det: det, timestamp: Date.now()
    });
}

// Renderers
function renderOil(l) { renderTable('table-oil', l, ['type','qty','unit','alert','date'], 'inventory_oil'); if(document.getElementById('st-oil')) document.getElementById('st-oil').innerText = l.length; }
function renderBen(l) { renderTable('table-ben', l, ['nom','qty','unit','alert','date'], 'inventory_ben'); if(document.getElementById('st-ben')) document.getElementById('st-ben').innerText = l.length; }
function renderStock(l) {
    const t = document.querySelector('#table-stock tbody'); if(!t) return; t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.des}</td><td>${i.cat}</td><td>${i.loc}</td><td>${i.qty}</td><td>${i.alert}</td><td class="center"><button class="btn-plus" onclick="window.app.editItem('inventory_stock','${i.id}')"><i class="fas fa-pen"></i></button></td></tr>`);
    if(document.getElementById('st-mat')) document.getElementById('st-mat').innerText = l.length;
}
function renderSortie(l) {
    const t = document.querySelector('#table-sortie tbody'); if(!t) return; t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.nom}</td><td>${i.qty}</td><td>${i.dest}</td><td>${i.rec}</td><td>${i.date.slice(0,10)}</td></tr>`);
}
function renderGasoil(l) {
    const t = document.querySelector('#table-gasoil tbody'); if(!t) return; t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.date}</td><td>${i.time}</td><td>${i.mac}</td><td>${i.sh}</td><td>${i.conso}</td><td>${i.user}</td></tr>`);
}
function renderActivity(l) {
    const t = document.querySelector('#table-act tbody'); if(!t) return; t.innerHTML = '';
    l.sort((a,b)=>b.timestamp-a.timestamp).forEach(i => t.innerHTML += `<tr><td>${i.date}</td><td>${i.time}</td><td>${i.user}</td><td>${i.act}</td><td>${i.det}</td></tr>`);
}

function renderTable(tid, list, keys, col) {
    const t = document.querySelector(`#${tid} tbody`); if(!t) return; t.innerHTML = '';
    list.forEach(i => {
        let row = '<tr>';
        keys.forEach(k => row += `<td>${i[k]||''}</td>`);
        row += `<td><button class="btn-plus" onclick="window.app.editItem('${col}','${i.id}')"><i class="fas fa-pen"></i></button></td></tr>`;
        t.innerHTML += row;
    });
}

// Utils
window.app.editItem = (col, id) => {
    const item = window.currentData[col].find(x => x.id === id);
    if(col === 'inventory_oil') fill('oil', id, item, 'type');
    if(col === 'inventory_ben') fill('ben', id, item, 'nom');
    if(col === 'inventory_stock') {
        document.getElementById('stk_id').value = id;
        document.getElementById('stk_des').value = item.des;
        document.getElementById('stk_cat').value = item.cat;
        document.getElementById('stk_qty').value = item.qty;
        document.getElementById('stk_loc').value = item.loc;
        document.getElementById('stk_alert').value = item.alert;
        document.getElementById('form-stock').scrollIntoView({behavior:'smooth'});
    }
};

function fill(p, id, item, nameKey) {
    document.getElementById(p+'_id').value = id;
    document.getElementById(p+'_name').value = item[nameKey];
    document.getElementById(p+'_qty').value = item.qty;
    document.getElementById(p+'_unit').value = item.unit;
    document.getElementById(p+'_alert').value = item.alert;
    document.getElementById('form-'+p).scrollIntoView({behavior:'smooth'});
}

window.app.resetForm = (id) => { document.getElementById(id).reset(); document.querySelectorAll(`#${id} input[type="hidden"]`).forEach(i=>i.value=''); };
window.app.exportTable = (id, n) => { let t=document.getElementById(id); let a=document.createElement('a'); a.href='data:application/vnd.ms-excel,'+t.outerHTML.replace(/ /g,'%20'); a.download=n+'.xls'; a.click(); };
function val(id) { let el = document.getElementById(id); return el ? el.value : ""; }
function num(id) { let el = document.getElementById(id); return el ? (parseFloat(el.value)||0) : 0; }
