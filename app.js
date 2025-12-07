import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy, limit, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// --- INITIALIZE WINDOW.APP FIRST (Fixes the "undefined" error) ---
window.app = {}; 

// --- YOUR FIREBASE CONFIG ---
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

// GLOBAL STATE
let currentUser = null;
let gasoilStock = 0;
window.currentData = {}; 

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded"); // Debug

    // 1. Login Logic - Check if button exists first
    const loginBtn = document.getElementById('btn-login-submit');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            console.log("Login Clicked");
            const user = document.getElementById('login-user').value;
            
            if(!user || user === "") {
                return alert("Sélectionnez un nom d'utilisateur valide.");
            }
            
            currentUser = user;
            document.getElementById('current-user-display').textContent = currentUser;
            
            // Hide Login
            document.getElementById('login-screen').style.opacity = '0';
            setTimeout(() => document.getElementById('login-screen').classList.add('hidden'), 500);
            
            // Start Listeners
            startAppListeners();
        });
    } else {
        console.error("ERREUR: Le bouton 'btn-login-submit' est introuvable. Vérifiez que vous utilisez le bon index.html");
    }

    // 2. Navigation Logic
    const menuItems = document.querySelectorAll('.menu-item');
    const sections = document.querySelectorAll('.section');
    const pageTitle = document.getElementById('page-title');

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            if (!currentUser) return alert("Veuillez vous connecter d'abord.");
            
            menuItems.forEach(i => i.classList.remove('active'));
            sections.forEach(s => s.classList.add('hidden'));
            
            const clickedItem = e.currentTarget;
            clickedItem.classList.add('active');
            const targetId = clickedItem.getAttribute('data-target');
            const targetSection = document.getElementById(targetId);
            
            if(targetSection) {
                targetSection.classList.remove('hidden');
                pageTitle.textContent = clickedItem.innerText;
            }
        });
    });

    // 3. Seeder & Dates
    const seedBtn = document.getElementById('btn-seed');
    if(seedBtn) seedBtn.addEventListener('click', seedDatabase);
    document.querySelectorAll('input[type="date"]').forEach(i => i.valueAsDate = new Date());
});

// --- LISTENER START ---
function startAppListeners() {
    listenToCol('inventory_oil', renderOil);
    listenToCol('inventory_ben', renderBen);
    listenToCol('inventory_stock', renderStock);
    listenToCol('log_gasoil', renderGasoil);
    listenToCol('log_sortie', renderSortie);
    listenToCol('log_activity', renderActivity);

    onSnapshot(doc(db, "settings", "global_config"), (s) => {
        if(s.exists()) {
            gasoilStock = s.data().gasoilStock || 0;
            updateGasoilDisplay();
        } else {
            setDoc(doc(db, "settings", "global_config"), { gasoilStock: 0 });
        }
    });

    listenToDropdown('list_oils', 'oil_name');
    listenToDropdown('list_chemicals', 'ben_name');
    listenToDropdown('list_machines', 'gas_machine');
    listenToDropdown('list_cats', 'stk_cat');
}

function updateGasoilDisplay() {
    const el1 = document.getElementById('gas_val');
    const el2 = document.getElementById('st-gas');
    if(el1) el1.textContent = gasoilStock;
    if(el2) el2.textContent = gasoilStock;
}

// --- DATABASE FUNCTIONS ---

async function seedDatabase() {
    if(!confirm("Cela va écraser les listes par défaut. Continuer ?")) return;

    const chemicals = ["SODA ASH", "TUNNEL GEL PLUS", "CLAY CUTTER", "DRILLING BENTONITE-SUPER GEL-X", "DRILLING BENTONITE HYDRAUL EZ", "DRILLING BENTONITE SWELL WELL SW150", "SUSPEND IT", "CAL", "PAC-L", "TUNNEL LUPE", "CEBO IPR-503", "F-SEAL 20KG/BAG"];
    await setDoc(doc(db, "lists", "list_chemicals"), { items: chemicals });

    const machines = ["CRANE 7737-B-50", "MANITOU", "TRUCK", "TGCC", "ATLAS COPCO", "HIMOINSA", "EXPRESS SAFI", "EXPRESS CASABLANCA", "MUTSHIBISHI CASABLANCA", "CAMION"];
    await setDoc(doc(db, "lists", "list_machines"), { items: machines });

    const oils = ["HYDRAULIC 68", "TAIL SEAL GREASE", "EP2 GREASE", "15W40 ENGINE"];
    await setDoc(doc(db, "lists", "list_oils"), { items: oils });

    const cats = ["Mécanique", "Electrique", "Levage", "Soudage", "EPI"];
    await setDoc(doc(db, "lists", "list_cats"), { items: cats });

    alert("Listes mises à jour !");
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

// --- ATTACH FUNCTIONS TO WINDOW.APP (So HTML onclick works) ---

window.app.addDynamicItem = async function(docName, selectId) {
    const val = prompt("Nouveau nom à ajouter :");
    if(!val) return;
    const docRef = doc(db, "lists", docName);
    const snap = await getDoc(docRef);
    let items = [];
    if(snap.exists()) items = snap.data().items;
    if(!items.includes(val.toUpperCase())) {
        items.push(val.toUpperCase());
        await setDoc(docRef, { items: items });
    }
};

window.app.saveOil = async () => saveGeneric('inventory_oil', 'oil', 'type', 'oil_name');
window.app.saveBen = async () => saveGeneric('inventory_ben', 'ben', 'nom', 'ben_name');

window.app.saveStock = async () => {
    const id = val('stk_id'); // Allow ID to be empty for new items
    const item = {
        des: val('stk_des'), cat: val('stk_cat'), qty: num('stk_qty'),
        loc: val('stk_loc'), alert: num('stk_alert'), user: currentUser,
        date: new Date().toISOString().split('T')[0]
    };
    if(!item.des) return alert("Nom requis.");
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
}

window.app.editGasoilStock = async () => {
    const n = prompt("Nouveau stock réel :", gasoilStock);
    if(n) await updateDoc(doc(db, "settings", "global_config"), { gasoilStock: parseFloat(n) });
}

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
        document.getElementById('form-stock').scrollIntoView({behavior:'smooth'});
    }
}

window.app.resetForm = (id) => { 
    document.getElementById(id).reset(); 
    document.querySelectorAll(`#${id} input[type="hidden"]`).forEach(i => i.value=''); 
}

window.app.exportTable = (id, n) => { 
    let t = document.getElementById(id); 
    let a = document.createElement('a'); 
    a.href = 'data:application/vnd.ms-excel,' + t.outerHTML.replace(/ /g,'%20'); 
    a.download = n+'.xls'; 
    a.click(); 
}

// --- INTERNAL HELPERS ---

async function saveGeneric(col, prefix, nameField, nameId) {
    const id = val(prefix+'_id'); // ID can be empty string
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
    if(id && id !== "") {
        await updateDoc(doc(db, col, id), item);
        logAction(`Modif ${type}`, name);
    } else {
        await addDoc(collection(db, col), item);
        logAction(`Ajout ${type}`, name);
    }
    // Alert handled by caller to prevent duplicates
}

function listenToCol(col, cb) {
    const sortBy = col.includes('log') ? 'timestamp' : 'qty';
    // Handle specific sorting logic per collection if needed, currently timestamp exists on logs
    let q;
    if(col.includes('log')) {
         q = query(collection(db, col), orderBy('date', 'desc'), limit(50));
    } else {
         q = query(collection(db, col), limit(100)); // Simple fetch for inventory
    }
    
    onSnapshot(q, (snap) => {
        let l = []; snap.forEach(d => l.push({id: d.id, ...d.data()}));
        window.currentData[col] = l;
        cb(l);
    });
}

function logAction(act, det) {
    addDoc(collection(db, 'log_activity'), {
        date: new Date().toLocaleDateString('fr-FR'), time: new Date().toLocaleTimeString('fr-FR'),
        user: currentUser, act: act, det: det, timestamp: Date.now()
    });
}

function renderOil(l) { renderTable('table-oil', l, ['type','qty','unit','alert','date','user'], 'inventory_oil'); if(document.getElementById('st-oil')) document.getElementById('st-oil').innerText = l.length; }
function renderBen(l) { renderTable('table-ben', l, ['nom','qty','unit','alert','date','user'], 'inventory_ben'); if(document.getElementById('st-ben')) document.getElementById('st-ben').innerText = l.length; }
function renderStock(l) {
    const t = document.querySelector('#table-stock tbody'); if(!t) return; t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.des}</td><td>${i.cat}</td><td>${i.loc}</td><td>${i.qty}</td><td>${i.alert}</td><td class="center"><button class="btn-plus" style="width:30px; height:30px;" onclick="window.app.editItem('inventory_stock','${i.id}')"><i class="fas fa-pen"></i></button></td></tr>`);
    if(document.getElementById('st-mat')) document.getElementById('st-mat').innerText = l.length;
}
function renderSortie(l) {
    const t = document.querySelector('#table-sortie tbody'); if(!t) return; t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.nom}</td><td>${i.qty}</td><td>${i.dest}</td><td>${i.rec}</td><td>${i.date ? i.date.slice(0,10) : ''}</td><td>${i.user}</td></tr>`);
}
function renderGasoil(l) {
    const t = document.querySelector('#table-gasoil tbody'); if(!t) return; t.innerHTML = '';
    l.forEach(i => t.innerHTML += `<tr><td>${i.date}</td><td>${i.time}</td><td>${i.mac}</td><td>${i.sh}</td><td>${i.conso}</td><td>${i.user}</td><td><i class="fas fa-check" style="color:green;"></i></td></tr>`);
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
        let badge = (i.qty <= i.alert) ? '<span style="color:red; font-weight:bold;">BAS</span>' : '<span style="color:green;">OK</span>';
        row += `<td><div style="display:flex; align-items:center; gap:10px;">${badge} <button class="btn-plus" style="width:30px; height:30px;" onclick="window.app.editItem('${col}','${i.id}')"><i class="fas fa-pen"></i></button></div></td></tr>`;
        t.innerHTML += row;
    });
}

function fill(p, id, item, nameKey) {
    document.getElementById(p+'_id').value = id;
    document.getElementById(p+'_name').value = item[nameKey];
    document.getElementById(p+'_qty').value = item.qty;
    document.getElementById(p+'_unit').value = item.unit;
    document.getElementById(p+'_alert').value = item.alert;
    document.getElementById('form-'+p).scrollIntoView({behavior:'smooth'});
}

function val(id) { let el = document.getElementById(id); return el ? el.value : ""; }
function num(id) { let el = document.getElementById(id); return el ? (parseFloat(el.value)||0) : 0; }
