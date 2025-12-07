import { useState, useEffect } from 'react';
import { firestoreWrapper, logActivity } from '../lib/firebase';
import { exportOutputToCSV } from '../lib/csvExport';
import { Plus, X, Download } from 'lucide-react';

interface OutputItem {
  id: string;
  nom: string;
  qty: number;
  dest: string;
  rec: string;
  date: string;
  user: string;
}

interface OutputDeliveryProps {
  currentUser: string;
}

export function OutputDelivery({ currentUser }: OutputDeliveryProps) {
  const [items, setItems] = useState<OutputItem[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    qty: '',
    dest: '',
    rec: ''
  });

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      let data = await firestoreWrapper.getCollection('eurohinca_log_sortie') as OutputItem[];
      // Sort by date descending
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      setItems(data);
    } catch (error) {
      console.error('Error loading output records:', error);
    }
  }

  function resetForm() {
    setFormData({ nom: '', qty: '', dest: '', rec: '' });
    setShowForm(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.nom || !formData.qty || !formData.dest || !formData.rec) return;

    setLoading(true);
    try {
      const data = {
        nom: formData.nom,
        qty: parseFloat(formData.qty),
        dest: formData.dest,
        rec: formData.rec,
        date: new Date().toISOString().split('T')[0],
        user: currentUser
      };

      await firestoreWrapper.addDoc('eurohinca_log_sortie', data);
      await logActivity(
        'Sortie',
        `${formData.nom} - ${formData.qty} unités vers ${formData.dest}`,
        currentUser
      );

      await loadItems();
      resetForm();
    } catch (error) {
      console.error('Error saving output:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900">Sortie Matériel</h2>
          <p className="text-slate-600">Enregistrement des sorties de matériel</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Enregistrer une sortie
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900">Enregistrer une sortie</h3>
              <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">Nom du matériel</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom ou description"
                  required
                />
              </div>

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
                <label className="block text-slate-700 mb-2">Destination</label>
                <input
                  type="text"
                  value={formData.dest}
                  onChange={(e) => setFormData({ ...formData, dest: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Destination ou chantier"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 mb-2">Réceptionnaire</label>
                <input
                  type="text"
                  value={formData.rec}
                  onChange={(e) => setFormData({ ...formData, rec: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nom du réceptionnaire"
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
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:bg-slate-300"
                >
                  {loading ? 'Enregistrement...' : 'Enregistrer'}
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
                <th className="px-6 py-3 text-left text-slate-700">Date</th>
                <th className="px-6 py-3 text-left text-slate-700">Matériel</th>
                <th className="px-6 py-3 text-left text-slate-700">Quantité</th>
                <th className="px-6 py-3 text-left text-slate-700">Destination</th>
                <th className="px-6 py-3 text-left text-slate-700">Réceptionnaire</th>
                <th className="px-6 py-3 text-left text-slate-700">Utilisateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Aucune sortie enregistrée
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-slate-900">{item.date}</td>
                    <td className="px-6 py-4 text-slate-900">{item.nom}</td>
                    <td className="px-6 py-4 text-slate-900">{item.qty}</td>
                    <td className="px-6 py-4 text-slate-600">{item.dest}</td>
                    <td className="px-6 py-4 text-slate-600">{item.rec}</td>
                    <td className="px-6 py-4 text-slate-600">{item.user}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <div className="mt-4">
        <button
          onClick={() => exportOutputToCSV(items)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter en CSV
        </button>
      </div>
    </div>
  );
}