import React, { useState } from 'react';
import { Search, Plus, Trash2, Edit3, Lock, Unlock, RotateCcw, Filter, RefreshCw, KeyRound, CheckSquare, Square, Eye, ShieldAlert } from 'lucide-react';
import { HotspotUser } from '../types';

interface UserManagerProps {
  users: HotspotUser[];
  onRefresh: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ users, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<HotspotUser | null>(null);
  const [inspectingUser, setInspectingUser] = useState<HotspotUser | null>(null);

  // Add user form state
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProfile, setNewProfile] = useState('100-F-4h');
  const [newComment, setNewComment] = useState('');

  // Edit user form state
  const [editProfile, setEditProfile] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editComment, setEditComment] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.comment && u.comment.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesProfile = selectedProfile === 'ALL' || u.profile === selectedProfile;
    return matchesSearch && matchesProfile;
  });

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u['.id']));
    }
  };

  const toggleSelectUser = (id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('mikhmon_token')}`
  });

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous vraiment supprimer l'utilisateur "${name}" du MikroTik ?`)) return;
    try {
      await fetch(`/api/router/users/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la suppression');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedUserIds.length === 0) return;
    if (!confirm(`Supprimer définitivement ${selectedUserIds.length} utilisateur(s) sélectionné(s) ?`)) return;

    for (const id of selectedUserIds) {
      try {
        await fetch(`/api/router/users/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
      } catch (e) {
        console.error('Batch delete error:', e);
      }
    }
    setSelectedUserIds([]);
    onRefresh();
  };

  const handleToggleDisable = async (user: HotspotUser) => {
    const isCurrentlyDisabled = user.disabled === 'true';
    const actionName = isCurrentlyDisabled ? 'réactiver' : 'suspendre / désactiver';
    if (!confirm(`Voulez-vous ${actionName} l'utilisateur "${user.name}" ?`)) return;

    try {
      await fetch(`/api/router/users/${encodeURIComponent(user['.id'])}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ disabled: !isCurrentlyDisabled })
      });
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la modification de l\'état');
    }
  };

  const handleResetCounters = async (user: HotspotUser) => {
    if (!confirm(`Réinitialiser les compteurs d'utilisation (temps et volume) pour "${user.name}" ?`)) return;
    try {
      await fetch(`/api/router/users/${encodeURIComponent(user['.id'])}/reset`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      alert(`Compteurs de ${user.name} réinitialisés !`);
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la réinitialisation');
    }
  };

  const handleOpenEdit = (user: HotspotUser) => {
    setEditingUser(user);
    setEditProfile(user.profile);
    setEditPassword('');
    setEditComment(user.comment || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await fetch(`/api/router/users/${encodeURIComponent(editingUser['.id'])}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          profile: editProfile,
          password: editPassword || undefined,
          comment: editComment
        })
      });
      setEditingUser(null);
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;
    try {
      await fetch('/api/vouchers/generate', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prefix: newUsername,
          length: 0,
          profile: newProfile,
          quantity: 1
        })
      });
      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewComment('');
      onRefresh();
    } catch (err) {
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Controls & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher code, nom client, FedaPay ref..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Profile Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">Tous les forfaits ({users.length})</option>
              <option value="100-F-4h">100-F-4h (4h)</option>
              <option value="200---12h">200---12h (12h)</option>
              <option value="300-F-24h">300-F-24h (24h)</option>
              <option value="500---4j">500---4j (4j)</option>
              <option value="1200---7j">1200---7j (7j)</option>
              <option value="4000--30j">4000--30j (30j)</option>
            </select>
          </div>

        </div>

        {/* Batch & Action Buttons */}
        <div className="flex items-center gap-2">
          {selectedUserIds.length > 0 && (
            <button
              onClick={handleBatchDelete}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-md shadow-rose-600/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Supprimer ({selectedUserIds.length})</span>
            </button>
          )}

          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Rafraîchir depuis le routeur"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Code Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Main Users Table */}
      <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="p-4 w-10">
                  <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                    {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Utilisateur / Code</th>
                <th className="p-4">Profil Forfait</th>
                <th className="p-4">Commentaire / FedaPay</th>
                <th className="p-4">Uptime / Conso</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Actions de Gestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center space-y-3 max-w-md mx-auto">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
                        <KeyRound className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Aucun utilisateur Hotspot affiché</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          Si votre MikroTik contient déjà des utilisateurs dans Winbox, vérifiez dans l'onglet <strong>Paramètres Routeur</strong> que l'adresse IP (ex: <code>10.0.0.254</code> ou l'IP de votre PC) et le port (<strong>8728</strong> ou <strong>80</strong>) sont correctement enregistrés.
                        </p>
                      </div>
                      <button
                        onClick={onRefresh}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20"
                      >
                        Rafraîchir les utilisateurs MikroTik
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isDisabled = u.disabled === 'true';
                  const isSelected = selectedUserIds.includes(u['.id']);

                  return (
                    <tr
                      key={u['.id']}
                      className={`transition-colors ${
                        isDisabled
                          ? 'bg-rose-950/20 text-slate-500'
                          : isSelected
                          ? 'bg-indigo-950/30'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="p-4">
                        <button onClick={() => toggleSelectUser(u['.id'])} className="text-slate-400 hover:text-white">
                          {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                        </button>
                      </td>

                      <td className="p-4 font-mono font-bold text-indigo-400 flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-slate-500" />
                        <span className={isDisabled ? 'line-through text-slate-500' : ''}>{u.name}</span>
                      </td>

                      <td className="p-4">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20 text-[11px]">
                          {u.profile}
                        </span>
                      </td>

                      <td className="p-4 text-slate-300 max-w-xs truncate">
                        {u.comment || <span className="text-slate-600 italic">Aucun</span>}
                      </td>

                      <td className="p-4 text-slate-400">
                        <div>{u.uptime || '0s'}</div>
                        <div className="text-[10px] text-slate-500">{u.bytesOut || '0 MB'} consommés</div>
                      </td>

                      <td className="p-4">
                        {isDisabled ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20 text-[10px]">
                            <Lock className="w-3 h-3" />
                            <span>SUSPENDU</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-[10px]">
                            <Unlock className="w-3 h-3" />
                            <span>ACTIF</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right space-x-1">
                        
                        {/* Inspect User details */}
                        <button
                          onClick={() => setInspectingUser(u)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                          title="Détails utilisateur"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit User */}
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-colors border border-indigo-500/20"
                          title="Modifier l'utilisateur"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Reset Counters */}
                        <button
                          onClick={() => handleResetCounters(u)}
                          className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-colors border border-amber-500/20"
                          title="Réinitialiser compteurs & temps"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>

                        {/* Disable/Enable */}
                        <button
                          onClick={() => handleToggleDisable(u)}
                          className={`p-2 rounded-lg transition-colors border ${
                            isDisabled
                              ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'
                              : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20'
                          }`}
                          title={isDisabled ? 'Activer le compte' : 'Suspendre le compte'}
                        >
                          {isDisabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(u['.id'], u.name)}
                          className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                          title="Supprimer du MikroTik"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT USER MODAL */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-400" />
                <span>Modifier Utilisateur "{editingUser.name}"</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Profil Forfait Hotspot</label>
                <select
                  value={editProfile}
                  onChange={(e) => setEditProfile(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="100-F-4h">100-F-4h (4 Heures - 100 FCFA)</option>
                  <option value="200---12h">200---12h (12 Heures - 200 FCFA)</option>
                  <option value="300-F-24h">300-F-24h (24 Heures - 300 FCFA)</option>
                  <option value="500---4j">500---4j (4 Jours - 500 FCFA)</option>
                  <option value="1200---7j">1200---7j (7 Jours - 1 200 FCFA)</option>
                  <option value="4000--30j">4000--30j (30 Jours - 4 000 FCFA)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Nouveau Mot de passe (laisser vide si inchangé)</label>
                <input
                  type="text"
                  placeholder="Laissez vide pour conserver"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Commentaire / Référence client</label>
                <input
                  type="text"
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Enregistrer Modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT USER MODAL */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-400" />
                <span>Propriétés MikroTik de "{inspectingUser.name}"</span>
              </h3>
              <button onClick={() => setInspectingUser(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Code Utilisateur / Name:</span>
                <span className="font-mono font-bold text-indigo-400">{inspectingUser.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Profil:</span>
                <span className="font-semibold text-slate-200">{inspectingUser.profile}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Statut:</span>
                <span className={inspectingUser.disabled === 'true' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                  {inspectingUser.disabled === 'true' ? 'SUSPENDU' : 'ACTIF'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Temps écoulé (Uptime):</span>
                <span className="text-slate-200">{inspectingUser.uptime || '0s'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Volume Téléchargé (Out):</span>
                <span className="text-slate-200">{inspectingUser.bytesOut || '0 MB'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-medium">Commentaire:</span>
                <span className="text-slate-300 font-mono text-[11px]">{inspectingUser.comment || 'Aucun'}</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setInspectingUser(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel bg-slate-900 p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              <span>Créer un utilisateur MikroTik</span>
            </h3>

            <form onSubmit={handleAddUser} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Code Utilisateur / Voucher</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 2MC-901"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Profil Hotspot</label>
                <select
                  value={newProfile}
                  onChange={(e) => setNewProfile(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="100-F-4h">100-F-4h (4 Heures - 100 FCFA)</option>
                  <option value="200---12h">200---12h (12 Heures - 200 FCFA)</option>
                  <option value="300-F-24h">300-F-24h (24 Heures - 300 FCFA)</option>
                  <option value="500---4j">500---4j (4 Jours - 500 FCFA)</option>
                  <option value="1200---7j">1200---7j (7 Jours - 1 200 FCFA)</option>
                  <option value="4000--30j">4000--30j (30 Jours - 4 000 FCFA)</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/20"
                >
                  Créer sur RB951Ui
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
