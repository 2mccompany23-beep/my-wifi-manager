import React, { useState, useMemo } from 'react';
import {
  Search, Plus, Trash2, Edit3, Lock, Unlock, RotateCcw, Filter, RefreshCw,
  KeyRound, CheckSquare, Square, Eye, Clock, ShieldAlert, CheckCircle2,
  XCircle, SlidersHorizontal, X, Activity, Zap, Loader2
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';
import { ToastContainer, useToast } from './Toast';
import { HotspotUser } from '../types';

interface UserManagerProps {
  users: HotspotUser[];
  onRefresh: () => void;
}

export const UserManager: React.FC<UserManagerProps> = ({ users = [], onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProfile, setSelectedProfile] = useState('ALL');
  const [uptimeFilter, setUptimeFilter] = useState<'ALL' | 'USED' | 'UNUSED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'EXPIRED'>('ALL');
  const [quickTab, setQuickTab] = useState<'ALL' | 'ACTIVE' | 'USED' | 'UNUSED' | 'EXPIRED'>('ALL');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Deletion loading states
  const [deletingUserIds, setDeletingUserIds] = useState<string[]>([]);
  const [isDeletingModal, setIsDeletingModal] = useState(false);
  const [deleteLoadingLabel, setDeleteLoadingLabel] = useState('Suppression en cours...');
  
  const { toasts, dismiss, success, error } = useToast();

  // Confirm modal state
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning';
    onConfirm: () => void;
  }>({ open: false, title: '', message: '', variant: 'danger', onConfirm: () => {} });

  const openConfirm = (title: string, message: string, variant: 'danger' | 'warning', onConfirm: () => void) => {
    setConfirmState({ open: true, title, message, variant, onConfirm });
  };
  const closeConfirm = () => setConfirmState((s) => ({ ...s, open: false }));

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

  const formatBytes = (bytes?: string | number): string => {
    if (!bytes || bytes === '0' || bytes === 0) return '0 MB';
    if (typeof bytes === 'string' && (bytes.includes('B') || bytes.includes('MB') || bytes.includes('GB') || bytes.includes('KB'))) {
      return bytes;
    }
    const num = Number(bytes);
    if (isNaN(num) || num === 0) return '0 MB';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    if (num < 1024 * 1024 * 1024) return `${(num / (1024 * 1024)).toFixed(1)} MB`;
    return `${(num / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const getUserBytesOut = (u?: HotspotUser): string => {
    if (!u) return '0 MB';
    const val = u.bytesOut || (u as any)['bytes-out'] || (u as any)['bytes-down'];
    return formatBytes(val);
  };

  const getUserBytesIn = (u?: HotspotUser): string => {
    if (!u) return '0 MB';
    const val = u.bytesIn || (u as any)['bytes-in'] || (u as any)['bytes-up'];
    return formatBytes(val);
  };

  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  // Helpers for filtering
  const hasUptime = (u: HotspotUser) => {
    const up = String(u.uptime || '').trim();
    return up !== '' && up !== '0s' && up !== '0' && up !== '00:00:00';
  };

  const extractDateFromComment = (comment?: string): Date | null => {
    if (!comment) return null;

    // ISO format: YYYY-MM-DD HH:mm:ss or YYYY-MM-DDTHH:mm:ss or YYYY-MM-DD
    const isoMatch = comment.match(/(\d{4})[-\/](\d{2})[-\/](\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (isoMatch) {
      const [_, y, m, d, hh = '00', mm = '00', ss = '00'] = isoMatch;
      const dateObj = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
      if (!isNaN(dateObj.getTime())) return dateObj;
    }

    // French/Mikhmon format: DD/MM/YYYY HH:mm:ss or DD.MM.YY or DD/MM/YYYY
    const frMatch = comment.match(/(\d{2})[\/\.](\d{2})[\/\.](\d{2,4})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (frMatch) {
      let [_, d, m, y, hh = '00', mm = '00', ss = '00'] = frMatch;
      if (y.length === 2) y = '20' + y;
      const dateObj = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
      if (!isNaN(dateObj.getTime())) return dateObj;
    }

    return null;
  };

  const parseDurationToSeconds = (durationStr?: string | number): number => {
    if (!durationStr) return 0;
    if (typeof durationStr === 'number') return durationStr;
    const str = String(durationStr).trim().toLowerCase();
    if (!str || str === '0' || str === '0s' || str === '00:00:00') return 0;

    let totalSeconds = 0;
    let remainingStr = str;

    // Check days e.g. 1d04:02:10 or 1d
    const dayMatch = remainingStr.match(/^(\d+)d\s*/);
    if (dayMatch) {
      totalSeconds += parseInt(dayMatch[1], 10) * 86400;
      remainingStr = remainingStr.replace(/^(\d+)d\s*/, '');
    }

    // Check HH:MM:SS or HH:MM
    const timeMatch = remainingStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3] || '0', 10);
      return totalSeconds + (hours * 3600) + (minutes * 60) + seconds;
    }

    // Check dhms formats e.g. 4h, 30m, 4h30m, 1d4h
    const hMatch = remainingStr.match(/(\d+)\s*h/);
    if (hMatch) totalSeconds += parseInt(hMatch[1], 10) * 3600;

    const mMatch = remainingStr.match(/(\d+)\s*m(?!s)/);
    if (mMatch) totalSeconds += parseInt(mMatch[1], 10) * 60;

    const sMatch = remainingStr.match(/(\d+)\s*s/);
    if (sMatch) totalSeconds += parseInt(sMatch[1], 10);

    if (totalSeconds > 0) return totalSeconds;

    const num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
  };

  const getProfileDurationLimit = (profileName?: string, limitUptimeStr?: string): number => {
    if (limitUptimeStr) {
      const sec = parseDurationToSeconds(limitUptimeStr);
      if (sec > 0) return sec;
    }

    if (!profileName) return 0;
    const name = String(profileName).trim().toLowerCase();

    // Check for days: 500---4j / 500---4d / 1200---7j / 4000--30j
    const dayMatch = name.match(/(\d+)\s*(?:j|d|jour|jours|day|days)\b/);
    if (dayMatch) {
      return parseInt(dayMatch[1], 10) * 86400;
    }

    // Check for hours: 100-F-4h / 200---12h / 300-F-24h
    const hourMatch = name.match(/(\d+)\s*(?:h|hr|hrs|heure|heures)\b/);
    if (hourMatch) {
      return parseInt(hourMatch[1], 10) * 3600;
    }

    // Check for minutes
    const minMatch = name.match(/(\d+)\s*(?:m|min|minute|minutes)\b/);
    if (minMatch) {
      return parseInt(minMatch[1], 10) * 60;
    }

    return 0;
  };

  const isExpiredOrExhausted = (u: HotspotUser) => {
    if (!u) return false;
    const isDisabled = String(u.disabled) === 'true';
    if (isDisabled) return true;

    const comment = String(u.comment || '').trim();
    const commentUpper = comment.toUpperCase();
    if (
      commentUpper.includes('EXPIRED') ||
      commentUpper.includes('EPUIS') ||
      commentUpper.includes('EXPIR') ||
      commentUpper.includes('FIN') ||
      commentUpper.includes('OUT')
    ) {
      return true;
    }

    // 1. Un utilisateur avec uptime > 0s et dont la date du commentaire est inférieure à la date actuelle est EXPIRÉ
    const hasUp = hasUptime(u);
    if (hasUp && comment) {
      const expirationDate = extractDateFromComment(comment);
      if (expirationDate && expirationDate.getTime() < Date.now()) {
        return true;
      }
    }

    // 2. Un utilisateur dont l'uptime consommé correspond ou dépasse la durée de son profil (ex: 04:00:00 pour 100-F-4h) est ÉPUISÉ
    const userUptimeSec = parseDurationToSeconds(u.uptime);
    const limitUptimeSec = getProfileDurationLimit(u.profile, u['limit-uptime'] || (u as any).limitUptime);

    if (limitUptimeSec > 0 && userUptimeSec > 0) {
      if (userUptimeSec >= limitUptimeSec - 5) {
        return true;
      }
    }

    return false;
  };

  // Counters for tabs and profiles
  const counts = useMemo(() => {
    let active = 0, used = 0, unused = 0, expired = 0;
    safeUsers.forEach((u) => {
      if (!u) return;
      const isExp = isExpiredOrExhausted(u);
      const hasUp = hasUptime(u);
      if (isExp) expired++;
      else active++;
      if (hasUp) used++;
      else unused++;
    });
    return { total: safeUsers.length, active, used, unused, expired };
  }, [safeUsers]);

  const profileCounts = useMemo(() => {
    const map: Record<string, number> = {};
    safeUsers.forEach((u) => {
      if (u?.profile) {
        map[u.profile] = (map[u.profile] || 0) + 1;
      }
    });
    return map;
  }, [safeUsers]);

  const defaultProfiles = ['100-F-4h', '200---12h', '300-F-24h', '500---4j', '1200---7j', '4000--30j'];
  const availableProfiles = Array.from(new Set([...defaultProfiles, ...Object.keys(profileCounts)]));

  // Multi-Filter Application
  const filteredUsers = useMemo(() => {
    return safeUsers.filter((u) => {
      if (!u) return false;
      const userName = String(u.name || u['.id'] || '');
      const userComment = String(u.comment || '');
      const userProfile = String(u.profile || '');
      const userHasUptime = hasUptime(u);
      const userIsExpired = isExpiredOrExhausted(u);

      // Search term
      const matchesSearch =
        userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        userComment.toLowerCase().includes(searchTerm.toLowerCase());

      // Profile dropdown filter
      const matchesProfile = selectedProfile === 'ALL' || userProfile === selectedProfile;

      // Quick tab selection
      let matchesQuick = true;
      if (quickTab === 'ACTIVE') matchesQuick = !userIsExpired;
      else if (quickTab === 'EXPIRED') matchesQuick = userIsExpired;
      else if (quickTab === 'USED') matchesQuick = userHasUptime;
      else if (quickTab === 'UNUSED') matchesQuick = !userHasUptime;

      // Dropdown uptime filter
      const matchesUptime =
        uptimeFilter === 'ALL' ||
        (uptimeFilter === 'USED' && userHasUptime) ||
        (uptimeFilter === 'UNUSED' && !userHasUptime);

      // Dropdown status filter
      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && !userIsExpired) ||
        (statusFilter === 'EXPIRED' && userIsExpired);

      return matchesSearch && matchesProfile && matchesQuick && matchesUptime && matchesStatus;
    });
  }, [safeUsers, searchTerm, selectedProfile, quickTab, uptimeFilter, statusFilter]);

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedProfile !== 'ALL' ||
    uptimeFilter !== 'ALL' ||
    statusFilter !== 'ALL' ||
    quickTab !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedProfile('ALL');
    setUptimeFilter('ALL');
    setStatusFilter('ALL');
    setQuickTab('ALL');
  };

  const handleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map((u) => u['.id'] || u.name || '').filter(Boolean));
    }
  };

  const handleSelectExpired = () => {
    const expiredIds = safeUsers
      .filter((u) => isExpiredOrExhausted(u))
      .map((u) => u['.id'] || u.name || '')
      .filter(Boolean);

    if (expiredIds.length === 0) {
      error('Aucun utilisateur épuisé ou expiré à marquer.');
      return;
    }

    const allExpiredSelected = expiredIds.every((id) => selectedUserIds.includes(id));

    if (allExpiredSelected) {
      setSelectedUserIds((prev) => prev.filter((id) => !expiredIds.includes(id)));
    } else {
      setSelectedUserIds((prev) => Array.from(new Set([...prev, ...expiredIds])));
      success(`${expiredIds.length} utilisateur(s) épuisé(s) marqué(s).`);
    }
  };

  const toggleSelectUser = (id: string) => {
    if (!id) return;
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionStorage.getItem('mikhmon_token')}`
  });

  const handleDeleteUser = (id: string, name: string) => {
    setDeleteLoadingLabel(`Suppression de "${name}"...`);
    openConfirm(
      'Supprimer l\'utilisateur',
      `Voulez-vous vraiment supprimer "${name}" du routeur MikroTik ? Cette action est irréversible.`,
      'danger',
      async () => {
        setIsDeletingModal(true);
        setDeletingUserIds((prev) => [...prev, id]);
        try {
          const res = await fetch(`/api/router/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getAuthHeaders() });
          if (!res.ok) throw new Error('Échec de la suppression');
          success(`Utilisateur "${name}" supprimé avec succès.`);
          closeConfirm();
          onRefresh();
        } catch {
          error('Erreur lors de la suppression. Vérifiez la connexion au routeur.');
        } finally {
          setIsDeletingModal(false);
          setDeletingUserIds((prev) => prev.filter((i) => i !== id));
        }
      }
    );
  };

  const handleBatchDelete = () => {
    if (selectedUserIds.length === 0) return;
    const count = selectedUserIds.length;
    setDeleteLoadingLabel(`Suppression de ${count} utilisateur(s)...`);
    openConfirm(
      'Suppression en lot',
      `Supprimer définitivement ${count} utilisateur(s) sélectionné(s) du routeur MikroTik ?`,
      'danger',
      async () => {
        setIsDeletingModal(true);
        setDeletingUserIds(selectedUserIds);
        try {
          const res = await fetch('/api/router/users/batch-delete', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids: selectedUserIds })
          });

          if (res.ok) {
            const data = await res.json();
            success(`${data.count || count} utilisateur(s) supprimé(s) avec succès.`);
          } else {
            // Fallback en parallèle si l'endpoint batch n'est pas dispo
            let ok = 0;
            await Promise.all(
              selectedUserIds.map(async (id) => {
                try {
                  const r = await fetch(`/api/router/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getAuthHeaders() });
                  if (r.ok) ok++;
                } catch (e) { console.error('Batch delete error:', e); }
              })
            );
            success(`${ok} utilisateur(s) supprimé(s) avec succès.`);
          }
          setSelectedUserIds([]);
          closeConfirm();
          onRefresh();
        } catch {
          error('Erreur lors de la suppression en lot. Vérifiez la connexion au routeur.');
        } finally {
          setIsDeletingModal(false);
          setDeletingUserIds([]);
        }
      }
    );
  };

  const handleToggleDisable = (user: HotspotUser) => {
    const isCurrentlyDisabled = String(user.disabled) === 'true';
    const action = isCurrentlyDisabled ? 'réactiver' : 'suspendre';
    const id = user['.id'] || user.name;
    openConfirm(
      isCurrentlyDisabled ? 'Réactiver le compte' : 'Suspendre le compte',
      `Voulez-vous ${action} le compte "${user.name || id}" ?`,
      isCurrentlyDisabled ? 'warning' : 'danger',
      async () => {
        try {
          await fetch(`/api/router/users/${encodeURIComponent(id)}`, {
            method: 'PATCH', headers: getAuthHeaders(),
            body: JSON.stringify({ disabled: !isCurrentlyDisabled })
          });
          success(isCurrentlyDisabled ? `"${user.name || id}" réactivé avec succès.` : `"${user.name || id}" suspendu.`);
          onRefresh();
        } catch {
          error('Erreur lors de la modification de l\'état.');
        }
      }
    );
  };

  const handleResetCounters = (user: HotspotUser) => {
    const id = user['.id'] || user.name;
    openConfirm(
      'Réinitialiser les compteurs',
      `Réinitialiser le temps et le volume utilisé pour "${user.name || id}" ?`,
      'warning',
      async () => {
        try {
          await fetch(`/api/router/users/${encodeURIComponent(id)}/reset`, { method: 'POST', headers: getAuthHeaders() });
          success(`Compteurs de "${user.name || id}" réinitialisés.`);
          onRefresh();
        } catch {
          error('Erreur lors de la réinitialisation.');
        }
      }
    );
  };

  const handleOpenEdit = (user: HotspotUser) => {
    setEditingUser(user);
    setEditProfile(user.profile || '100-F-4h');
    setEditPassword('');
    setEditComment(user.comment || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const id = editingUser['.id'] || editingUser.name;
    try {
      await fetch(`/api/router/users/${encodeURIComponent(id)}`, {
        method: 'PATCH', headers: getAuthHeaders(),
        body: JSON.stringify({ profile: editProfile, password: editPassword || undefined, comment: editComment })
      });
      success(`"${editingUser.name || id}" mis à jour avec succès.`);
      setEditingUser(null);
      onRefresh();
    } catch {
      error('Erreur lors de la mise à jour.');
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername) return;
    try {
      await fetch('/api/vouchers/generate', {
        method: 'POST', headers: getAuthHeaders(),
        body: JSON.stringify({ prefix: newUsername, length: 0, profile: newProfile, quantity: 1 })
      });
      success(`Utilisateur "${newUsername}" créé avec succès sur le MikroTik.`);
      setShowAddModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewComment('');
      onRefresh();
    } catch {
      error('Erreur lors de la création de l\'utilisateur.');
    }
  };

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <ConfirmModal
        isOpen={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        variant={confirmState.variant}
        confirmLabel={confirmState.variant === 'danger' ? 'Confirmer la suppression' : 'Confirmer'}
        loadingLabel={deleteLoadingLabel}
        isLoading={isDeletingModal}
        onConfirm={confirmState.onConfirm}
        onCancel={closeConfirm}
      />

      <div className="space-y-4 sm:space-y-6">

        {/* Quick Filter Chips Bar (Tabs rapides) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'Tous les comptes', count: counts.total, icon: KeyRound, color: 'indigo' },
            { id: 'ACTIVE', label: 'Actifs', count: counts.active, icon: CheckCircle2, color: 'emerald' },
            { id: 'USED', label: 'Uptime > 0s (Consommé)', count: counts.used, icon: Clock, color: 'purple' },
            { id: 'UNUSED', label: 'Jamais utilisés (0s)', count: counts.unused, icon: Activity, color: 'slate' },
            { id: 'EXPIRED', label: 'Épuisés / Expirés', count: counts.expired, icon: XCircle, color: 'rose' },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = quickTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setQuickTab(tab.id as any);
                  // Sync select dropdowns cleanly
                  if (tab.id === 'USED' || tab.id === 'UNUSED') {
                    setUptimeFilter(tab.id);
                  } else {
                    setUptimeFilter('ALL');
                  }
                  if (tab.id === 'EXPIRED' || tab.id === 'ACTIVE') {
                    setStatusFilter(tab.id);
                  } else {
                    setStatusFilter('ALL');
                  }
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20 scale-[1.02]'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed Controls & Filter Bar */}
        <div className="glass-panel p-4 rounded-2xl space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Global Search Input */}
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher code voucher, nom client, FedaPay ref, commentaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs">✕</button>
              )}
            </div>

            {/* Select Dropdown Filters */}
            <div className="flex flex-wrap items-center gap-2">
              
              {/* Profile Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 min-w-[170px]">
                <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <select
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                  className="bg-transparent w-full text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="ALL" className="bg-slate-900">Tous les Forfaits ({safeUsers.length})</option>
                  {availableProfiles.map((prof) => (
                    <option key={prof} value={prof} className="bg-slate-900">
                      {prof} {profileCounts[prof] !== undefined ? `(${profileCounts[prof]})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Uptime Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
                <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <select
                  value={uptimeFilter}
                  onChange={(e) => {
                    setUptimeFilter(e.target.value as any);
                    setQuickTab(e.target.value === 'ALL' ? 'ALL' : (e.target.value as any));
                  }}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="ALL" className="bg-slate-900">Tout Uptime</option>
                  <option value="USED" className="bg-slate-900">Consommé (Uptime &gt; 0s)</option>
                  <option value="UNUSED" className="bg-slate-900">Jamais utilisé (Uptime = 0s)</option>
                </select>
              </div>

              {/* Status / Expired Filter Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as any);
                    setQuickTab(e.target.value === 'ALL' ? 'ALL' : (e.target.value as any));
                  }}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-medium"
                >
                  <option value="ALL" className="bg-slate-900">Tous les Statuts</option>
                  <option value="ACTIVE" className="bg-slate-900">Actifs Uniquement</option>
                  <option value="EXPIRED" className="bg-slate-900">Épuisés / Expirés / Suspendus</option>
                </select>
              </div>

              {/* Reset Filters button */}
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold border border-rose-500/30 transition-colors"
                  title="Réinitialiser tous les filtres"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Réinitialiser</span>
                </button>
              )}

            </div>

          </div>

          {/* Action Bar & Results Count */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Affichage de <strong className="text-white font-bold">{filteredUsers.length}</strong> sur {safeUsers.length} utilisateur(s)</span>
              {hasActiveFilters && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">
                  Filtres actifs
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {counts.expired > 0 && (
                <button
                  onClick={handleSelectExpired}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 transition-colors shrink-0"
                  title="Marquer/sélectionner tous les utilisateurs épuisés ou expirés"
                >
                  <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>Marquer les épuisés ({counts.expired})</span>
                </button>
              )}

              {selectedUserIds.length > 0 && (
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeletingModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors shadow-md shadow-rose-600/20 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
                >
                  {isDeletingModal ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Trash2 className="w-4 h-4 shrink-0" />}
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
        </div>

        {/* Mobile Card List (Visible on screens < 768px) */}
        <div className="block md:hidden space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-400 rounded-2xl space-y-2">
              <KeyRound className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="font-bold text-xs text-white">Aucun utilisateur ne correspond aux filtres</p>
              {hasActiveFilters && (
                <button
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold mt-2"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            filteredUsers.map((u, index) => {
              const userId = u['.id'] || u.name || `user-${index}`;
              const userName = u.name || u['.id'] || 'Sans nom';
              const isExpired = isExpiredOrExhausted(u);
              const isDisabled = String(u.disabled) === 'true';
              const isSelected = selectedUserIds.includes(userId);

              return (
                <div
                  key={userId}
                  className={`glass-card p-3.5 rounded-2xl border flex flex-col gap-2.5 transition-colors ${
                    isExpired
                      ? 'border-rose-500/30 bg-rose-950/20'
                      : isSelected
                      ? 'border-indigo-500/50 bg-indigo-950/30'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <button onClick={() => toggleSelectUser(userId)} className="text-slate-400 hover:text-white shrink-0">
                        {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                      </button>
                      <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className={`font-mono font-bold text-sm text-white truncate ${isDisabled ? 'line-through text-slate-500' : ''}`}>{userName}</span>
                    </div>
                    {isExpired ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20 text-[10px] shrink-0">ÉPUISÉ / EXPIRÉ</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/20 text-[10px] shrink-0">ACTIF</span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between text-xs gap-1.5 border-t border-slate-800/60 pt-2">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20 text-[10px]">{u.profile || '100-F-4h'}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-purple-400" />
                      <span>{u.uptime || '0s'}</span>
                      <span className="text-slate-600">•</span>
                      <span>{getUserBytesOut(u)}</span>
                    </span>
                  </div>

                  {u.comment && (
                    <div className="text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/50 truncate">
                      {u.comment}
                    </div>
                  )}

                  {/* Mobile Action Buttons Bar */}
                  <div className="flex items-center justify-end gap-1.5 border-t border-slate-800/60 pt-2">
                    <button onClick={() => setInspectingUser(u)} className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700" title="Détails">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleOpenEdit(u)} className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" title="Modifier">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleResetCounters(u)} className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20" title="Réinitialiser">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleToggleDisable(u)} className={`p-2 rounded-lg border ${isDisabled ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`} title={isDisabled ? 'Activer' : 'Suspendre'}>
                      {isDisabled ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(userId, userName)}
                      disabled={deletingUserIds.includes(userId) || isDeletingModal}
                      className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Supprimer"
                    >
                      {deletingUserIds.includes(userId) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Users Table (Visible on screens >= 768px) */}
        <div className="hidden md:block glass-panel rounded-2xl overflow-hidden border border-slate-800">
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
                          <h4 className="text-sm font-bold text-white">Aucun utilisateur correspondant</h4>
                          <p className="text-xs text-slate-400 mt-1">
                            Ajustez vos filtres ou effectuez une recherche différente pour afficher des utilisateurs.
                          </p>
                        </div>
                        {hasActiveFilters && (
                          <button
                            onClick={handleResetFilters}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors shadow-md shadow-indigo-600/20"
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, index) => {
                    const userId = u['.id'] || u.name || `user-${index}`;
                    const userName = u.name || u['.id'] || 'Sans nom';
                    const isExpired = isExpiredOrExhausted(u);
                    const isDisabled = String(u.disabled) === 'true';
                    const isSelected = selectedUserIds.includes(userId);

                    return (
                      <tr
                        key={userId}
                        className={`transition-colors ${
                          isExpired
                            ? 'bg-rose-950/20 text-slate-500'
                            : isSelected
                            ? 'bg-indigo-950/30'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="p-4">
                          <button onClick={() => toggleSelectUser(userId)} className="text-slate-400 hover:text-white">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                          </button>
                        </td>

                        <td className="p-4 font-mono font-bold text-indigo-400 flex items-center gap-2">
                          <KeyRound className="w-4 h-4 text-slate-500" />
                          <span className={isDisabled ? 'line-through text-slate-500' : ''}>{userName}</span>
                        </td>

                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 font-semibold border border-indigo-500/20 text-[11px]">
                            {u.profile || '100-F-4h'}
                          </span>
                        </td>

                        <td className="p-4 text-slate-300 max-w-xs truncate">
                          {u.comment || <span className="text-slate-600 italic">Aucun</span>}
                        </td>

                        <td className="p-4 text-slate-400">
                          <div className="font-semibold text-slate-200 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-purple-400" />
                            <span>{u.uptime || '0s'}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">{getUserBytesOut(u)} consommés</div>
                        </td>

                        <td className="p-4">
                          {isExpired ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20 text-[10px]">
                              <Lock className="w-3 h-3" />
                              <span>ÉPUISÉ / EXPIRÉ</span>
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
                            onClick={() => handleDeleteUser(userId, userName)}
                            disabled={deletingUserIds.includes(userId) || isDeletingModal}
                            className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Supprimer du MikroTik"
                          >
                            {deletingUserIds.includes(userId) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
                  <span>Modifier Utilisateur "{editingUser.name || editingUser['.id'] || ''}"</span>
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
                  <span>Propriétés MikroTik de "{inspectingUser.name || inspectingUser['.id'] || ''}"</span>
                </h3>
                <button onClick={() => setInspectingUser(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Code Utilisateur / Name:</span>
                  <span className="font-mono font-bold text-indigo-400">{inspectingUser.name || inspectingUser['.id'] || 'Sans nom'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Profil:</span>
                  <span className="font-semibold text-slate-200">{inspectingUser.profile || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Statut:</span>
                  <span className={isExpiredOrExhausted(inspectingUser) ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {isExpiredOrExhausted(inspectingUser) ? 'ÉPUISÉ / EXPIRÉ' : 'ACTIF'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Temps écoulé (Uptime):</span>
                  <span className="text-slate-200">{inspectingUser.uptime || '0s'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Volume Téléchargé (Out):</span>
                  <span className="text-slate-200">{getUserBytesOut(inspectingUser)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400 font-medium">Volume Envoyé (In):</span>
                  <span className="text-slate-200">{getUserBytesIn(inspectingUser)}</span>
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
    </>
  );
};
