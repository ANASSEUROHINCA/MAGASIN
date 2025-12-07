import { useState, useEffect } from 'react';
import { firestoreWrapper, getDieselStock } from '../lib/firebase';
import { Droplet, Beaker, Package, Fuel, AlertTriangle, TrendingUp } from 'lucide-react';

interface DashboardProps {
  currentUser: string;
  onNavigate: (tab: 'dashboard' | 'oils' | 'chemicals' | 'parts' | 'output' | 'diesel' | 'history' | 'lowstock') => void;
}

export function Dashboard({ currentUser, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState({
    oilsCount: 0,
    chemicalsCount: 0,
    partsCount: 0,
    dieselStock: 0,
    lowStockItems: 0,
    recentActivities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    setLoading(true);
    try {
      // Get oils count
      const oils = await firestoreWrapper.getCollection('eurohinca_inventory_oil');
      const oilsCount = oils.length;

      // Get chemicals count
      const chemicals = await firestoreWrapper.getCollection('eurohinca_inventory_ben');
      const chemicalsCount = chemicals.length;

      // Get parts count
      const parts = await firestoreWrapper.getCollection('eurohinca_inventory_stock');
      const partsCount = parts.length;

      // Get diesel stock
      const dieselStock = await getDieselStock();

      // Count low stock items (where qty <= alert)
      let lowStockCount = 0;
      oils.forEach((item: any) => {
        if (item.qty <= item.alert) lowStockCount++;
      });
      chemicals.forEach((item: any) => {
        if (item.qty <= item.alert) lowStockCount++;
      });
      parts.forEach((item: any) => {
        if (item.qty <= item.alert) lowStockCount++;
      });

      // Get recent activities count
      const activities = await firestoreWrapper.getCollection('eurohinca_log_activity');
      const recentActivities = activities.length;

      setStats({
        oilsCount,
        chemicalsCount,
        partsCount,
        dieselStock,
        lowStockItems: lowStockCount,
        recentActivities
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Huiles & Graisses',
      value: stats.oilsCount,
      icon: Droplet,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      title: 'Bentonite & Chimie',
      value: stats.chemicalsCount,
      icon: Beaker,
      color: 'bg-purple-500',
      textColor: 'text-purple-600'
    },
    {
      title: 'Stock Matériel',
      value: stats.partsCount,
      icon: Package,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    },
    {
      title: 'Stock Gasoil (L)',
      value: `${stats.dieselStock.toLocaleString()}`,
      icon: Fuel,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      title: 'Alertes Stock Bas',
      value: stats.lowStockItems,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600'
    },
    {
      title: 'Activités Récentes',
      value: stats.recentActivities,
      icon: TrendingUp,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-600'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-slate-900 mb-2">Tableau de Bord</h2>
        <p className="text-slate-600">Vue d&apos;ensemble du stock et des activités</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const isLowStock = card.title === 'Alertes Stock Bas';
          return (
            <div
              key={card.title}
              onClick={() => isLowStock && card.value > 0 ? onNavigate('lowstock') : undefined}
              className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow ${
                isLowStock && card.value > 0 ? 'cursor-pointer hover:border-red-300' : ''
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${card.textColor}`} />
                </div>
              </div>
              <h3 className="text-slate-600 text-sm mb-1">{card.title}</h3>
              <p className={`${card.textColor}`}>{card.value}</p>
              {isLowStock && card.value > 0 && (
                <p className="text-xs text-slate-500 mt-2">Cliquez pour voir les détails</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-slate-900 mb-4">Bienvenue, {currentUser}</h3>
        <p className="text-slate-600">
          Utilisez les onglets ci-dessus pour gérer les différentes catégories de stock. 
          Le système enregistre automatiquement toutes vos actions dans l&apos;historique.
        </p>
      </div>
    </div>
  );
}