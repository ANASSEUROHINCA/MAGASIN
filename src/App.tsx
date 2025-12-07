import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { Oils } from './components/Oils';
import { Chemicals } from './components/Chemicals';
import { SpareParts } from './components/SpareParts';
import { OutputDelivery } from './components/OutputDelivery';
import { DieselManagement } from './components/DieselManagement';
import { ActivityLog } from './components/ActivityLog';
import { LowStockView } from './components/LowStockView';
import { LayoutDashboard, Droplet, Beaker, Package, TruckIcon, Fuel, History } from 'lucide-react';

type Tab = 'dashboard' | 'oils' | 'chemicals' | 'parts' | 'output' | 'diesel' | 'history' | 'lowstock';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');

  if (!currentUser) {
    return <Login onLogin={setCurrentUser} />;
  }

  const tabs = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'oils' as Tab, label: 'Huiles & Graisses', icon: Droplet },
    { id: 'chemicals' as Tab, label: 'Bentonite & Chimie', icon: Beaker },
    { id: 'parts' as Tab, label: 'Stock Matériel', icon: Package },
    { id: 'output' as Tab, label: 'Sortie Matériel', icon: TruckIcon },
    { id: 'diesel' as Tab, label: 'Gestion Gasoil', icon: Fuel },
    { id: 'history' as Tab, label: 'Historique', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-slate-900">EUROHINCA</h1>
              <p className="text-slate-600 text-sm">Système de Gestion de Stock</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-700">Utilisateur: {currentUser}</span>
              <button
                onClick={() => setCurrentUser(null)}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <Dashboard currentUser={currentUser} onNavigate={setActiveTab} />}
        {activeTab === 'oils' && <Oils currentUser={currentUser} />}
        {activeTab === 'chemicals' && <Chemicals currentUser={currentUser} />}
        {activeTab === 'parts' && <SpareParts currentUser={currentUser} />}
        {activeTab === 'output' && <OutputDelivery currentUser={currentUser} />}
        {activeTab === 'diesel' && <DieselManagement currentUser={currentUser} />}
        {activeTab === 'history' && <ActivityLog />}
        {activeTab === 'lowstock' && <LowStockView />}
      </main>
    </div>
  );
}