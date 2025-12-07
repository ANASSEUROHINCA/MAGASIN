import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { getListItems, addListItem } from '../lib/firebase';

interface DynamicDropdownProps {
  listName: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export function DynamicDropdown({ listName, value, onChange, placeholder, label }: DynamicDropdownProps) {
  const [items, setItems] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadItems();
  }, [listName]);

  async function loadItems() {
    const list = await getListItems(listName);
    setItems(list);
  }

  async function handleAddItem() {
    if (!newItem.trim()) return;
    
    setLoading(true);
    try {
      await addListItem(listName, newItem.trim());
      await loadItems();
      onChange(newItem.trim());
      setNewItem('');
      setShowAddDialog(false);
    } catch (error) {
      console.error('Error adding item:', error);
      alert('Erreur lors de l\'ajout de l\'élément');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {label && (
        <label className="block text-slate-700 mb-2">
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">{placeholder || '-- Sélectionner --'}</option>
          {items.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setShowAddDialog(true)}
          className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          title="Ajouter un nouvel élément"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Add Item Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-900">Ajouter un nouvel élément</h3>
              <button
                onClick={() => setShowAddDialog(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-slate-700 mb-2">
                  Nom de l&apos;élément
                </label>
                <input
                  type="text"
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddItem()}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Entrez le nom..."
                  autoFocus
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItem.trim() || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {loading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
