import { useState } from 'react';
import { Users } from 'lucide-react';

interface LoginProps {
  onLogin: (user: string) => void;
}

const users = [
  'Issam Abahmane',
  'Mehdi Kridid',
  'Yassine Faradi',
  'Zakaria Essabir',
  'Admin'
];

export function Login({ onLogin }: LoginProps) {
  const [selectedUser, setSelectedUser] = useState('');

  const handleLogin = () => {
    if (selectedUser) {
      onLogin(selectedUser);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-slate-900 mb-2">EUROHINCA</h1>
          <p className="text-slate-600">Système de Gestion de Stock</p>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="user-select" className="block text-slate-700 mb-2">
              Sélectionnez votre nom
            </label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">-- Choisir un utilisateur --</option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleLogin}
            disabled={!selectedUser}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            Se connecter
          </button>
        </div>
      </div>
    </div>
  );
}
