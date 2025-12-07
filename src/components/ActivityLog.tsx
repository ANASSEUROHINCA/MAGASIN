import { useState, useEffect } from 'react';
import { firestoreWrapper } from '../lib/firebase';
import { exportActivityToCSV } from '../lib/csvExport';
import { Clock, User, FileText, Download } from 'lucide-react';

interface Activity {
  id: string;
  action: string;
  details: string;
  user: string;
  date: string;
  time: string;
  timestamp: string;
}

export function ActivityLog() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    setLoading(true);
    try {
      let data = await firestoreWrapper.getCollection('eurohinca_log_activity') as Activity[];
      // Sort manually by timestamp
      data.sort((a, b) => {
        const dateA = new Date(a.timestamp || a.date);
        const dateB = new Date(b.timestamp || b.date);
        return dateB.getTime() - dateA.getTime();
      });
      setActivities(data.slice(0, 100));
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredActivities = filter === 'all' 
    ? activities 
    : activities.filter(a => a.action.toLowerCase().includes(filter.toLowerCase()));

  const getActionColor = (action: string) => {
    if (action.includes('Ajout')) return 'text-green-600 bg-green-50';
    if (action.includes('Modification')) return 'text-blue-600 bg-blue-50';
    if (action.includes('Suppression')) return 'text-red-600 bg-red-50';
    if (action.includes('Consommation')) return 'text-orange-600 bg-orange-50';
    if (action.includes('Sortie')) return 'text-purple-600 bg-purple-50';
    return 'text-slate-600 bg-slate-50';
  };

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
        <h2 className="text-slate-900 mb-2">Historique des Activités</h2>
        <p className="text-slate-600">Journal de toutes les opérations effectuées</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Toutes
        </button>
        <button
          onClick={() => setFilter('ajout')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'ajout' 
              ? 'bg-green-600 text-white' 
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Ajouts
        </button>
        <button
          onClick={() => setFilter('modification')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'modification' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Modifications
        </button>
        <button
          onClick={() => setFilter('suppression')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'suppression' 
              ? 'bg-red-600 text-white' 
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Suppressions
        </button>
        <button
          onClick={() => setFilter('consommation')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filter === 'consommation' 
              ? 'bg-orange-600 text-white' 
              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
          }`}
        >
          Consommations
        </button>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="divide-y divide-slate-200">
          {filteredActivities.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500">
              Aucune activité enregistrée
            </div>
          ) : (
            filteredActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${getActionColor(activity.action)}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs ${getActionColor(activity.action)}`}>
                        {activity.action}
                      </span>
                      <span className="text-slate-600 text-sm">{activity.details}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {activity.date} {activity.time && `à ${activity.time}`}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {activity.user}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {filteredActivities.length > 0 && (
        <div className="mt-4 text-center text-sm text-slate-500">
          Affichage de {filteredActivities.length} activité(s)
        </div>
      )}

      {/* Export Button */}
      <div className="mt-6 text-center">
        <button
          onClick={() => exportActivityToCSV(filteredActivities)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exporter en CSV
        </button>
      </div>
    </div>
  );
}