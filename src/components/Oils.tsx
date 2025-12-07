import { useState, useEffect } from 'react';
import { firestoreWrapper, logActivity } from '../lib/firebase';
import { DynamicDropdown } from './DynamicDropdown';
import { exportOilsToCSV } from '../lib/csvExport';
import { Plus, Trash2, Edit2, X, Save, Download } from 'lucide-react';

interface OilItem {
  id: string;
  type: string;
  qty: number;
  unit: string;
  alert: number;
  date: string;
  user: string;
}

interface OilsProps {
  currentUser: string;
}

export function Oils({ currentUser }: OilsProps) {
  const [items, setItems] = useState<OilItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    qty: '',
    unit: 'L',
    alert: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      const data = await firestoreWrapper.getCollection('eurohinca_inventory_oil') as OilItem[];
      setItems(data);
    } catch (error) {
      console.error('Error loading oils:', error);
    }
  }

  function resetForm() {
    setFormData({ type: '', qty: '', unit: 'L', alert: '' });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.type || !formData.qty || !formData.alert) return;

    setLoading(true);
    try {
      const data = {
        type: formData.type,
        qty: parseFloat(formData.qty),
        unit: formData.unit,
        alert: parseFloat(formData.alert),
        date: new Date().toISOString().split('T')[0],
        user: currentUser
      };

      if (editingId) {
        await firestoreWrapper.updateDoc('eurohinca_inventory_oil', editingId, data);
        await logActivity('Modification', `Huile modifiée: ${formData.type}`, currentUser);
      } else {
        await firestoreWrapper.addDoc('eurohinca_inventory_oil', data);
        await logActivity('Ajout', `Huile ajoutée: ${formData.type} - ${formData.qty}${formData.unit}`, currentUser);
      }

      await loadItems();
      resetForm();
    } catch (error) {
      console.error('Error saving oil:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, type: string) {
    if (!confirm(`Supprimer ${type} ?`)) return;

    try {
      await firestoreWrapper.deleteDoc('eurohinca_inventory_oil', id);
      await logActivity('Suppression', `Huile supprimée: ${type}`, currentUser);
      await loadItems();
    } catch (error) {
      console.error('Error deleting oil:', error);
      alert('Erreur lors de la suppression');
    }
  }

  function handleEdit(item: OilItem) {
    setFormData({
      type: item.type,
      qty: item.qty.toString(),
      unit: item.unit,
      alert: item.alert.toString()
    });
    setEditingId(item.id);
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900">Huiles & Graisses</h2>
          <p className="text-slate-600">Gestion de l&apos;inventaire des huiles</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Ajouter une huile
          </button>
          <button
            onClick={() => exportOilsToCSV(items)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Télécharger CSV
          </button>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900">
                {editingId ? 'Modifier l\'huile' : 'Ajouter une huile'}
              </h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <DynamicDropdown
                listName="list_oils"
                value={formData.type}
                onChange={(value) => setFormData({ ...formData, type: value })}
                placeholder="-- Sélectionner une huile --"
                label="Type d'huile"
              />

              <div>
                <label className="block text-slate-700 mb-2">Quantité</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.qty}
                  onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Unité</label>
                <select
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="L">Litres (L)</option>
                  <option value="KG">Kilogrammes (KG)</option>
                  <option value="unité">Unité</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Seuil d&apos;alerte</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.alert}
                  onChange={(e) => setFormData({ ...formData, alert: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300"
                >
                  {loading ? 'Enregistrement...' : editingId ? 'Modifier' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-slate-700">Type</th>
                <th className="px-6 py-3 text-left text-slate-700">Quantité</th>
                <th className="px-6 py-3 text-left text-slate-700">Unité</th>
                <th className="px-6 py-3 text-left text-slate-700">Alerte</th>
                <th className="px-6 py-3 text-left text-slate-700">Date</th>
                <th className="px-6 py-3 text-left text-slate-700">Utilisateur</th>
                <th className="px-6 py-3 text-left text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Aucune huile enregistrée
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className={item.qty <= item.alert ? 'bg-red-50' : 'hover:bg-slate-50'}
                  >
                    <td className="px-6 py-4 text-slate-900">{item.type}</td>
                    <td className="px-6 py-4 text-slate-900">{item.qty}</td>
                    <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                    <td className="px-6 py-4 text-slate-600">{item.alert}</td>
                    <td className="px-6 py-4 text-slate-600">{item.date}</td>
                    <td className="px-6 py-4 text-slate-600">{item.user}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.type)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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