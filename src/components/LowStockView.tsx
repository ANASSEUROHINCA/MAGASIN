import { useState, useEffect } from 'react';
import { firestoreWrapper } from '../lib/firebase';
import { exportLowStockToCSV } from '../lib/csvExport';
import { AlertTriangle, Download } from 'lucide-react';

interface LowStockItem {
  id: string;
  type: string;
  name: string;
  qty: number;
  unit: string;
  alert: number;
  category: string;
  date: string;
  user: string;
}

export function LowStockView() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLowStockItems();
  }, []);

  async function loadLowStockItems() {
    setLoading(true);
    try {
      const lowStockItems: LowStockItem[] = [];

      // Get oils with low stock
      const oils = await firestoreWrapper.getCollection('eurohinca_inventory_oil');
      oils.forEach((item: any) => {
        if (item.qty <= item.alert) {
          lowStockItems.push({
            id: item.id,
            type: 'Huiles & Graisses',
            name: item.type,
            qty: item.qty,
            unit: item.unit,
            alert: item.alert,
            category: 'Huiles',
            date: item.date,
            user: item.user
          });
        }
      });

      // Get chemicals with low stock
      const chemicals = await firestoreWrapper.getCollection('eurohinca_inventory_ben');
      chemicals.forEach((item: any) => {
        if (item.qty <= item.alert) {
          lowStockItems.push({
            id: item.id,
            type: 'Bentonite & Chimie',
            name: item.nom,
            qty: item.qty,
            unit: item.unit,
            alert: item.alert,
            category: 'Chimie',
            date: item.date,
            user: item.user
          });
        }
      });

      // Get spare parts with low stock
      const parts = await firestoreWrapper.getCollection('eurohinca_inventory_stock');
      parts.forEach((item: any) => {
        if (item.qty <= item.alert) {
          lowStockItems.push({
            id: item.id,
            type: 'Stock Matériel',
            name: item.des,
            qty: item.qty,
            unit: 'unité',
            alert: item.alert,
            category: item.cat || 'N/A',
            date: item.date,
            user: item.user
          });
        }
      });

      setItems(lowStockItems);
    } catch (error) {
      console.error('Error loading low stock items:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    exportLowStockToCSV(items);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 mb-2">Alertes Stock Bas</h2>
          <p className="text-slate-600">Articles dont le stock est inférieur ou égal au seuil d&apos;alerte</p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-slate-900 mb-2">Aucune alerte de stock bas</h3>
          <p className="text-slate-600">Tous les articles ont un stock suffisant.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-red-50 border-b border-red-200">
                <tr>
                  <th className="px-6 py-3 text-left text-red-900">Catégorie</th>
                  <th className="px-6 py-3 text-left text-red-900">Nom / Description</th>
                  <th className="px-6 py-3 text-left text-red-900">Stock Actuel</th>
                  <th className="px-6 py-3 text-left text-red-900">Unité</th>
                  <th className="px-6 py-3 text-left text-red-900">Seuil Alerte</th>
                  <th className="px-6 py-3 text-left text-red-900">Différence</th>
                  <th className="px-6 py-3 text-left text-red-900">Date</th>
                  <th className="px-6 py-3 text-left text-red-900">Utilisateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.map((item) => {
                  const difference = item.alert - item.qty;
                  const severity = item.qty === 0 ? 'bg-red-100' : item.qty < item.alert * 0.5 ? 'bg-orange-50' : 'bg-yellow-50';
                  
                  return (
                    <tr key={item.id} className={severity}>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-white rounded text-sm text-slate-700 border border-slate-200">
                          {item.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-900">{item.name}</td>
                      <td className="px-6 py-4">
                        <span className="text-red-700">{item.qty}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.unit}</td>
                      <td className="px-6 py-4 text-slate-600">{item.alert}</td>
                      <td className="px-6 py-4">
                        <span className="text-red-600">
                          {item.qty === 0 ? 'Stock épuisé' : `-${difference.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{item.date}</td>
                      <td className="px-6 py-4 text-slate-600">{item.user}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-orange-900 mb-1">Attention: {items.length} article(s) nécessite(nt) un réapprovisionnement</p>
              <p className="text-orange-700 text-sm">
                Veuillez commander ces articles dès que possible pour éviter les ruptures de stock.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
