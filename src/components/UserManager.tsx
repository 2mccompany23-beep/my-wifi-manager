import React, { useState, useMemo, useCallback } from 'react';
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

  const [deletingUserIds, setDeletingUserIds] = useState<string[]>([]);
  const [isDeletingModal, setIsDeletingModal] = useState(false);
  const [deleteLoadingLabel, setDeleteLoadingLabel] = useState('Suppression en cours...');
  
  const { toasts, dismiss, success, error } = useToast();

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [inspectingUser, setInspectingUser] = useState<HotspotUser | null>(null);

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newProfile, setNewProfile] = useState('100-F-4h');
  const [newComment, setNewComment] = useState('');
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

  const getUserTotalBytes = (u?: HotspotUser): string => {
    if (!u) return '0 MB';
    if ((u as any).bytesTotal && (u as any).bytesTotal !== '0 MB') return (u as any).bytesTotal;
    if ((u as any)['bytes-total'] && typeof (u as any)['bytes-total'] === 'string') return (u as any)['bytes-total'];

    const parseNum = (v: any) => {
      if (!v) return 0;
      if (typeof v === 'number') return isNaN(v) ? 0 : v;
      if (typeof v === 'string') {
        const trimmed = v.trim();
        if (/^\d+$/.test(trimmed)) return parseInt(trimmed, 10);
        const match = trimmed.match(/([\d\.]+)\s*(B|KB|MB|GB|TB)/i);
        if (match) {
          const num = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          if (unit === 'B') return num;
          if (unit === 'KB') return num * 1024;
          if (unit === 'MB') return num * 1024 * 1024;
          if (unit === 'GB') return num * 1024 * 1024 * 1024;
          if (unit === 'TB') return num * 1024 * 1024 * 1024 * 1024;
        }
        const n = Number(trimmed);
        return isNaN(n) ? 0 : n;
      }
      return 0;
    };

    const inVal = parseNum(u.bytesIn || (u as any)['bytes-in'] || (u as any)['bytes-up']);
    const outVal = parseNum(u.bytesOut || (u as any)['bytes-out'] || (u as any)['bytes-down']);
    const total = inVal + outVal;
    if (total > 0) return formatBytes(total);
    return '0 MB';
  };

  const formatUptimeDisplay = (uptimeStr?: string | number): string => {
    if (!uptimeStr || uptimeStr === '0' || uptimeStr === '0s') return '0s';
    const str = String(uptimeStr).trim();
    if (/^\d{1,2}:\d{2}:\d{2}$/.test(str) || /^\d+[dhms]$/.test(str)) return str;
    if (str.startsWith('1970') || str.includes('T')) {
      const timeMatch = str.match(/(\d{2}):(\d{2}):(\d{2})/);
      if (timeMatch) return timeMatch[0];
    }
    const sec = parseDurationToSeconds(str);
    if (sec <= 0) return '0s';
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return `${d}d ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const safeUsers = useMemo(() => (Array.isArray(users) ? users : []), [users]);

  const hasUptime = (u: HotspotUser) => {
    const up = String(u.uptime || '').trim();
    return up !== '' && up !== '0s' && up !== '0' && up !== '00:00:00';
  };

  const extractDateFromComment = (comment?: string): Date | null => {
    if (!comment) return null;
    
    // Format ISO: YYYY-MM-DD HH:mm:ss
    const isoMatch = comment.match(/(\d{4})[-\/](\d{2})[-\/](\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (isoMatch) {
      const [_, y, m, d, hh = '00', mm = '00', ss = '00'] = isoMatch;
      const dateObj = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
      if (!isNaN(dateObj.getTime())) return dateObj;
    }

    // Format MikroTik / Mikhmon: aug/03/2026 21:19:03
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
    };
    const mikhmonMatch = comment.match(/([a-zA-Z]{3})[\/\.](\d{2})[\/\.](\d{4})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/i);
    if (mikhmonMatch) {
      const [_, mon, d, y, hh = '00', mm = '00', ss = '00'] = mikhmonMatch;
      const m = monthNames[mon.toLowerCase()];
      if (m) {
        const dateObj = new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}`);
        if (!isNaN(dateObj.getTime())) return dateObj;
      }
    }

    // Format Français: DD/MM/YYYY HH:mm:ss
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
    const dayMatch = remainingStr.match(/^(\d+)d\s*/);
    if (dayMatch) {
      totalSeconds += parseInt(dayMatch[1], 10) * 86400;
      remainingStr = remainingStr.replace(/^(\d+)d\s*/, '');
    }
    const timeMatch = remainingStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3] || '0', 10);
      return totalSeconds + (hours * 3600) + (minutes * 60) + seconds;
    }
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
    const dayMatch = name.match(/(\d+)\s*(?:j|d|jour|jours|day|days)\b/);
    if (dayMatch) return parseInt(dayMatch[1], 10) * 86400;
    const hourMatch = name.match(/(\d+)\s*(?:h|hr|hrs|heure|heures)\b/);
    if (hourMatch) return parseInt(hourMatch[1], 10) * 3600;
    const minMatch = name.match(/(\d+)\s*(?:m|min|minute|minutes)\b/);
    if (minMatch) return parseInt(minMatch[1], 10) * 60;
    return 0;
  };

  const isExpiredOrExhausted = (u: HotspotUser) => {
    if (!u) return false;
    const isDisabled = String(u.disabled) === 'true';
    if (isDisabled) return true;

    const comment = String(u.comment || '').trim();
    const commentUpper = comment.toUpperCase();
    if (commentUpper.includes('EXP-') || commentUpper.includes('EXPIRED') || commentUpper.includes('EPUIS') || commentUpper.includes('EXPIRE')) {
      return true;
    }

    const userUptimeSec = parseDurationToSeconds(u.uptime);
    const limitUptimeSec = getProfileDurationLimit(u.profile, u['limit-uptime'] || (u as any).limitUptime);
    if (limitUptimeSec > 0 && userUptimeSec > 0 && userUptimeSec >= limitUptimeSec - 5) {
      return true;
    }

    const hasUp = hasUptime(u);
    if (hasUp && comment && limitUptimeSec > 0) {
      const activationDate = extractDateFromComment(comment);
      if (activationDate) {
        const expirationTimestamp = activationDate.getTime() + (limitUptimeSec * 1000);
        if (Date.now() >= expirationTimestamp) {
          return true;
        }
      }
    }

    return false;
  };

  const userStatusCache = useMemo(() => {
    const cache = new Map<string, { isExpired: boolean; hasUptime: boolean }>();
    safeUsers.forEach((u) => {
      if (!u) return;
      const userId = u['.id'] || u.name || '';
      cache.set(userId, { isExpired: isExpiredOrExhausted(u), hasUptime: hasUptime(u) });
    });
    return cache;
  }, [safeUsers]);

  const getCachedUserStatus = useCallback((u: HotspotUser) => {
    if (!u) return { isExpired: false, hasUptime: false };
    const userId = u['.id'] || u.name || '';
    return userStatusCache.get(userId) || { isExpired: false, hasUptime: false };
  }, [userStatusCache]);

  const counts = useMemo(() => {
    let active = 0, used = 0, unused = 0, expired = 0;
    safeUsers.forEach((u) => {
      if (!u) return;
      const cached = userStatusCache.get(u['.id'] || u.name || '') || { isExpired: false, hasUptime: false };
      if (cached.isExpired) expired++; else active++;
      if (cached.hasUptime) used++; else unused++;
    });
    return { total: safeUsers.length, active, used, unused, expired };
  }, [safeUsers, userStatusCache]);

  const profileCounts = useMemo(() => {
    const map: Record<string, number> = {};
    safeUsers.forEach((u) => {
      if (u?.profile) map[u.profile] = (map[u.profile] || 0) + 1;
    });
    return map;
  }, [safeUsers]);

  const defaultProfiles = ['100-F-4h', '200---12h', '300-F-24h', '500---4j', '1200---7j', '4000--30j'];
  const availableProfiles = Array.from(new Set([...defaultProfiles, ...Object.keys(profileCounts)]));

  const filteredUsers = useMemo(() => {
    return safeUsers.filter((u) => {
      if (!u) return false;
      const userName = String(u.name || u['.id'] || '');
      const userComment = String(u.comment || '');
      const userProfile = String(u.profile || '');
      const cached = userStatusCache.get(u['.id'] || u.name || '') || { isExpired: false, hasUptime: false };
      const userHasUptime = cached.hasUptime;
      const userIsExpired = cached.isExpired;

      const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) || userComment.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesProfile = selectedProfile === 'ALL' || userProfile === selectedProfile;
      let matchesQuick = true;
      if (quickTab === 'ACTIVE') matchesQuick = !userIsExpired;
      else if (quickTab === 'EXPIRED') matchesQuick = userIsExpired;
      else if (quickTab === 'USED') matchesQuick = userHasUptime;
      else if (quickTab === 'UNUSED') matchesQuick = !userHasUptime;
      const matchesUptime = uptimeFilter === 'ALL' || (uptimeFilter === 'USED' && userHasUptime) || (uptimeFilter === 'UNUSED' && !userHasUptime);
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' && !userIsExpired) || (statusFilter === 'EXPIRED' && userIsExpired);

      return matchesSearch && matchesProfile && matchesQuick && matchesUptime && matchesStatus;
    });
  }, [safeUsers, searchTerm, selectedProfile, quickTab, uptimeFilter, statusFilter, userStatusCache]);

  const hasActiveFilters = searchTerm !== '' || selectedProfile !== 'ALL' || uptimeFilter !== 'ALL' || statusFilter !== 'ALL' || quickTab !== 'ALL';

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
      .filter((u) => {
        const cached = userStatusCache.get(u['.id'] || u.name || '');
        return cached ? cached.isExpired : false;
      })
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
    setSelectedUserIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
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
            let ok = 0;
            await Promise.all(selectedUserIds.map(async (id) => {
              try {
                const r = await fetch(`/api/router/users/${encodeURIComponent(id)}`, { method: 'DELETE', headers: getAuthHeaders() });
                if (r.ok) ok++;
              } catch (e) { console.error('Batch delete error:', e); }
            }));
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

        {/* Quick Filter Chips Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {[
            { id: 'ALL', label: 'Tous les comptes', count: counts.total, icon: KeyRound },
            { id: 'ACTIVE', label: 'Actifs', count: counts.active, icon: CheckCircle2 },
            { id: 'USED', label: 'Uptime > 0s', count: counts.used, icon: Clock },
            { id: 'UNUSED', label: 'Jamais utilisés', count: counts.unused, icon: Activity },
            { id: 'EXPIRED', label: 'Épuisés / Expirés', count: counts.expired, icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = quickTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setQuickTab(tab.id as any);
                  if (tab.id === 'USED' || tab.id === 'UNUSED') setUptimeFilter(tab.id as any);
                  else setUptimeFilter('ALL');
                  if (tab.id === 'EXPIRED' || tab.id === 'ACTIVE') setStatusFilter(tab.id as any);
                  else setStatusFilter('ALL');
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
                  isActive ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-900/80 text-slate-400 border-slate-800'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed Controls & Filter Bar */}
        <div className="glass-panel p-4 rounded-2xl space-y-3">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
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

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 min-w-[170px]">
                <Filter className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <select value={selectedProfile} onChange={(e) => setSelectedProfile(e.target.value)} className="bg-transparent w-full text-xs text-slate-200 focus:outline-none cursor-pointer font-medium">
                  <option value="ALL" className="bg-slate-900">Tous les Forfaits ({safeUsers.length})</option>
                  {availableProfiles.map((prof) => (
                    <option key={prof} value={prof} className="bg-slate-900">{prof} {profileCounts[prof] !== undefined ? `(${profileCounts[prof]})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
                <Clock className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <select value={uptimeFilter} onChange={(e) => { setUptimeFilter(e.target.value as any); setQuickTab(e.target.value === 'ALL' ? 'ALL' : (e.target.value as any)); }} className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-medium">
                  <option value="ALL" className="bg-slate-900">Tout Uptime</option>
                  <option value="USED" className="bg-slate-900">Consommé</option>
                  <option value="UNUSED" className="bg-slate-900">Jamais utilisé</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200">
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as any); setQuickTab(e.target.value === 'ALL' ? 'ALL' : (e.target.value as any)); }} className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer font-medium">
                  <option value="ALL" className="bg-slate-900">Tous les Statuts</option>
                  <option value="ACTIVE" className="bg-slate-900">Actifs Uniquement</option>
                  <option value="EXPIRED" className="bg-slate-900">Épuisés / Expirés</option>
                </select>
              </div>

              {hasActiveFilters && (
                <button onClick={handleResetFilters} className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold border border-rose-500/30">
                  <X className="w-3.5 h-3.5" /><span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80 pt-3">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
              <span>Affichage de <strong className="text-white font-bold">{filteredUsers.length}</strong> sur {safeUsers.length} utilisateur(s)</span>
              {hasActiveFilters && <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px]">Filtres actifs</span>}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {counts.expired > 0 && (
                <button onClick={handleSelectExpired} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs border border-rose-500/20 shrink-0">
                  <XCircle className="w-4 h-4 shrink-0" /><span>Marquer les épuisés ({counts.expired})</span>
                </button>
              )}
              {selectedUserIds.length > 0 && (
                <button onClick={handleBatchDelete} disabled={isDeletingModal} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs disabled:opacity-60 shrink-0">
                  {isDeletingModal ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  <span>Supprimer ({selectedUserIds.length})</span>
                </button>
              )}
              <button onClick={onRefresh} className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700" title="Rafraîchir">
                <RefreshCw className="w-4 h-4" />
              </button>
              <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs">
                <Plus className="w-4 h-4" /><span>Nouveau Code Utilisateur</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Card List */}
        <div className="block md:hidden space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="glass-panel p-8 text-center text-slate-400 rounded-2xl">
              <KeyRound className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-xs text-white">Aucun utilisateur ne correspond aux filtres</p>
            </div>
          ) : filteredUsers.map((u, index) => {
            const userId = u['.id'] || u.name || `user-${index}`;
            const userName = u.name || u['.id'] || 'Sans nom';
            const cached = userStatusCache.get(userId) || { isExpired: false, hasUptime: false };
            const isExpired = cached.isExpired;
            const isDisabled = String(u.disabled) === 'true';
            const isSelected = selectedUserIds.includes(userId);

            return (
              <div key={userId} className={`glass-card p-3.5 rounded-2xl border flex flex-col gap-2.5 ${isExpired ? 'border-rose-500/30 bg-rose-950/20' : isSelected ? 'border-indigo-500/50 bg-indigo-950/30' : 'border-slate-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <button onClick={() => toggleSelectUser(userId)} className="text-slate-400 hover:text-white shrink-0">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                    </button>
                    <KeyRound className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className={`font-mono font-bold text-sm text-white truncate ${isDisabled ? 'line-through text-slate-500' : ''}`}>{userName}</span>
                  </div>
                  {isExpired ? <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] shrink-0">ÉPUISÉ / EXPIRÉ</span> : <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] shrink-0">ACTIF</span>}
                </div>
                <div className="flex flex-wrap items-center justify-between text-xs gap-1.5 border-t border-slate-800/60 pt-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px]">{u.profile || '100-F-4h'}</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-purple-400" />
                    <span>{formatUptimeDisplay(u.uptime)}</span>
                    <span className="text-slate-600">•</span>
                    <span>{getUserTotalBytes(u)}</span>
                  </span>
                </div>
                {u.comment && <div className="text-[11px] text-slate-400 bg-slate-900/60 px-2.5 py-1.5 rounded-xl border border-slate-800/50 truncate">{u.comment}</div>}
                <div className="flex items-center justify-end gap-1.5 border-t border-slate-800/60 pt-2">
                  <button onClick={() => setInspectingUser(u)} className="p-2 rounded-lg bg-slate-800 text-slate-300 border border-slate-700" title="Détails"><Eye className="w-3.5 h-3.5" /></button>
                  <button onClick={() => handleDeleteUser(userId, userName)} disabled={deletingUserIds.includes(userId) || isDeletingModal} className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 disabled:opacity-50" title="Supprimer">
                    {deletingUserIds.includes(userId) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block glass-panel rounded-2xl overflow-hidden border border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="p-4 w-10">
                    <button onClick={handleSelectAll} className="text-slate-400 hover:text-white">
                      {selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0 ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="p-4">Utilisateur / Code</th>
                  <th className="p-4">Profil Forfait</th>
                  <th className="p-4">Commentaire / FedaPay</th>
                  <th className="p-4">Uptime / Conso</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredUsers.length === 0 ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400">Aucun utilisateur correspondant</td></tr>
                ) : filteredUsers.map((u, index) => {
                  const userId = u['.id'] || u.name || `user-${index}`;
                  const userName = u.name || u['.id'] || 'Sans nom';
                  const cached = userStatusCache.get(userId) || { isExpired: false, hasUptime: false };
                  const isExpired = cached.isExpired;
                  const isDisabled = String(u.disabled) === 'true';
                  const isSelected = selectedUserIds.includes(userId);

                  return (
                    <tr key={userId} className={`transition-colors ${isExpired ? 'bg-rose-950/20 text-slate-500' : isSelected ? 'bg-indigo-950/30' : 'hover:bg-slate-800/40'}`}>
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
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px]">{u.profile || '100-F-4h'}</span>
                      </td>
                      <td className="p-4 text-slate-300 max-w-xs truncate">{u.comment || <span className="text-slate-600 italic">Aucun</span>}</td>
                      <td className="p-4 text-slate-400">
                        <div className="font-semibold text-slate-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-400" />
                          <span>{formatUptimeDisplay(u.uptime)}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">{getUserTotalBytes(u)} consommés</div>
                      </td>
                      <td className="p-4">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px]">
                            <Lock className="w-3 h-3" /><span>ÉPUISÉ / EXPIRÉ</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                            <Unlock className="w-3 h-3" /><span>ACTIF</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button onClick={() => setInspectingUser(u)} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700" title="Détails"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteUser(userId, userName)} disabled={deletingUserIds.includes(userId) || isDeletingModal} className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 disabled:opacity-50" title="Supprimer">
                          {deletingUserIds.includes(userId) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

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
                  <span className="text-slate-400">Code Utilisateur:</span>
                  <span className="font-mono font-bold text-indigo-400">{inspectingUser.name || inspectingUser['.id'] || 'Sans nom'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Profil:</span>
                  <span className="font-semibold text-slate-200">{inspectingUser.profile || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Statut:</span>
                  <span className={isExpiredOrExhausted(inspectingUser) ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {isExpiredOrExhausted(inspectingUser) ? 'ÉPUISÉ / EXPIRÉ' : 'ACTIF'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Uptime:</span>
                  <span className="text-slate-200">{formatUptimeDisplay(inspectingUser.uptime)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Volume Total:</span>
                  <span className="font-bold text-indigo-400">{getUserTotalBytes(inspectingUser)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Download:</span>
                  <span className="text-slate-200">{getUserBytesOut(inspectingUser)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Upload:</span>
                  <span className="text-slate-200">{getUserBytesIn(inspectingUser)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-800">
                  <span className="text-slate-400">Commentaire:</span>
                  <span className="text-slate-300 font-mono text-[11px]">{inspectingUser.comment || 'Aucun'}</span>
                </div>
              </div>
              <div className="pt-2 text-right">
                <button onClick={() => setInspectingUser(null)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs">Fermer</button>
              </div>
            </div>
          </div>
        )}

        {/* ADD USER MODAL */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="glass-panel bg-slate-900 p-6 rounded-2xl max-w-md w-full border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" /><span>Créer un utilisateur MikroTik</span>
              </h3>
              <form onSubmit={handleAddUser} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Code Utilisateur</label>
                  <input type="text" required placeholder="Ex: 2MC-901" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 font-medium">Profil Hotspot</label>
                  <select value={newProfile} onChange={(e) => setNewProfile(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-indigo-500">
                    <option value="100-F-4h">100-F-4h (4 Heures - 100 FCFA)</option>
                    <option value="200---12h">200---12h (12 Heures - 200 FCFA)</option>
                    <option value="300-F-24h">300-F-24h (24 Heures - 300 FCFA)</option>
                    <option value="500---4j">500---4j (4 Jours - 500 FCFA)</option>
                    <option value="1200---7j">1200---7j (7 Jours - 1 200 FCFA)</option>
                    <option value="4000--30j">4000--30j (30 Jours - 4 000 FCFA)</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-slate-800">
                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold">Annuler</button>
                  <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">Créer sur MikroTik</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};