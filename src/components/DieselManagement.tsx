import { useState, useEffect } from 'react';
import { firestoreWrapper, logActivity, getDieselStock, updateDieselStock, subtractDieselStock, initializeDefaultLists } from '../lib/firebase';
import { DynamicDropdown } from './DynamicDropdown';
import { exportDieselToCSV } from '../lib/csvExport';
import { Plus, X, Edit, Fuel, Download } from 'lucide-react';

interface DieselEntry {
  id: string;
  mac: string;
  sh: string;
  conso: number;
  date: string;
  time: string;
  user: string;
}

interface DieselManagementProps {
  currentUser: string;
}

export function DieselManagement({ currentUser }: DieselManagementProps) {
  const [entries, setEntries] = useState<DieselEntry[]>([]);
  const [totalStock, setTotalStock] = useState(0);
  const [showConsumptionForm, setShowConsumptionForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [consumptionData, setConsumptionData] = useState({
    mac: '',
    sh: '',
    conso: ''
  });
  const [newStockValue, setNewStockValue] = useState('');

  useEffect(() => {
    initializeDefaultLists();
    loadData();
  }, []);

  async function loadData() {
    await loadEntries();
    await loadStock();
  }

  async function loadEntries() {
    try {
      let data = await firestoreWrapper.getCollection('eurohinca_log_gasoil') as DieselEntry[];
      // Sort by date descending
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      setEntries(data);
    } catch (error) {
      console.error('Error loading diesel entries:', error);
    }
  }

  async function loadStock() {
    const stock = await getDieselStock();
    setTotalStock(stock);
  }

  function resetConsumptionForm() {
    setConsumptionData({ mac: '', sh: '', conso: '' });
    setShowConsumptionForm(false);
  }

  async function handleConsumptionSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consumptionData.mac || !consumptionData.sh || !consumptionData.conso) return;

    const consoAmount = parseFloat(consumptionData.conso);
    if (consoAmount > totalStock) {
      alert('Stock insuffisant ! Stock actuel: ' + totalStock + ' L');
      return;
    }

    setLoading(true);
    try {
      const now = new Date();
      const data = {
        mac: consumptionData.mac,
        sh: consumptionData.sh,
        conso: consoAmount,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('fr-FR'),
        user: currentUser
      };

      await firestoreWrapper.addDoc('eurohinca_log_gasoil', data);
      
      // Subtract from total stock
      const newStock = await subtractDieselStock(consoAmount);
      
      await logActivity(
        'Consommation Gasoil',
        `${consumptionData.mac} - ${consoAmount}L (Nouveau stock: ${newStock}L)`,
        currentUser
      );

      await loadData();
      resetConsumptionForm();
    } catch (error) {
      console.error('Error saving consumption:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  }

  async function handleStockUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!newStockValue) return;

    const stockValue = parseFloat(newStockValue);
    if (stockValue < 0) {
      alert('Le stock ne peut pas être négatif');
      return;
    }

    setLoading(true);
    try {
      await updateDieselStock(stockValue);
      await logActivity(
        'Mise à jour Stock Gasoil',
        `Stock mis à jour: ${stockValue}L`,
        currentUser
      );

      await loadStock();
      setNewStockValue('');
      setShowStockForm(false);
    } catch (error) {
      console.error('Error updating stock:', error);
      alert('Erreur lors de la mise à jour du stock');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900">Gestion Gasoil</h2>
          <p className="text-slate-600">Suivi de la consommation et du stock de gasoil</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStockForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Modifier Stock
          </button>
          <button
            onClick={() => setShowConsumptionForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Enregistrer Consommation
          </button>
          <button
            onClick={() => exportDieselToCSV(entries)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger CSV
          </button>
        </div>
      </div>

      {/* Stock Display Card */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-lg">
            <Fuel className="w-8 h-8" />
          </div>
          <div>
            <p className="text-orange-100 mb-1">Stock Total de Gasoil</p>
            <p className="text-white">{totalStock.toLocaleString()} Litres</p>
          </div>
        </div>
      </div>

      {/* Consumption Form Modal */}
      {showConsumptionForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900">Enregistrer Consommation</h3>
              <button onClick={resetConsumptionForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConsumptionSubmit} className="space-y-4">
              <DynamicDropdown
                listName="list_machines"
                value={consumptionData.mac}
                onChange={(value) => setConsumptionData({ ...consumptionData, mac: value })}
                placeholder="-- Sélectionner une machine --"
                label="Machine"
              />

              <div>
                <label className="block text-slate-700 mb-2">Shift / Poste</label>
                <select
                  value={consumptionData.sh}
                  onChange={(e) => setConsumptionData({ ...consumptionData, sh: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">-- Sélectionner --</option>
                  <option value="Jour">Jour</option>
                  <option value="Nuit">Nuit</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Consommation (Litres)</label>
                <input
                  type="number"
                  step="0.01"
                  value={consumptionData.conso}
                  onChange={(e) => setConsumptionData({ ...consumptionData, conso: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-sm text-slate-500 mt-1">
                  Stock disponible: {totalStock.toLocaleString()} L
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetConsumptionForm}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-slate-300"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Update Form Modal */}
      {showStockForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900">Modifier le Stock Total</h3>
              <button onClick={() => setShowStockForm(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockUpdate} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">Nouveau Stock Total (Litres)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newStockValue}
                  onChange={(e) => setNewStockValue(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={totalStock.toString()}
                  required
                />
                <p className="text-sm text-slate-500 mt-1">
                  Stock actuel: {totalStock.toLocaleString()} L
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowStockForm(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300"
                >
                  {loading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consumption History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-slate-900">Historique des Consommations</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-slate-700">Date</th>
                <th className="px-6 py-3 text-left text-slate-700">Heure</th>
                <th className="px-6 py-3 text-left text-slate-700">Machine</th>
                <th className="px-6 py-3 text-left text-slate-700">Shift</th>
                <th className="px-6 py-3 text-left text-slate-700">Consommation (L)</th>
                <th className="px-6 py-3 text-left text-slate-700">Utilisateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Aucune consommation enregistrée
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">{entry.date}</td>
                    <td className="px-6 py-4 text-slate-600">{entry.time}</td>
                    <td className="px-6 py-4 text-slate-900">{entry.mac}</td>
                    <td className="px-6 py-4 text-slate-600">{entry.sh}</td>
                    <td className="px-6 py-4 text-slate-900">{entry.conso} L</td>
                    <td className="px-6 py-4 text-slate-600">{entry.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}