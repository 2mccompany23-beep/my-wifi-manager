/**
 * Helper centralisé pour la gestion du token d'authentification Mikhmon/Hotspot.
 * Garantit la cohérence entre localStorage et sessionStorage sur tous les appareils
 * (résout le bug où un onglet réouvert sur téléphone perd le token sessionStorage
 * alors que localStorage est encore actif).
 */

export const getAuthToken = (): string => {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('mikhmon_token') || sessionStorage.getItem('mikhmon_token') || '';
  
  // Auto-synchronisation si le token n'est présent que dans l'un des deux stockages
  if (token) {
    if (!sessionStorage.getItem('mikhmon_token')) {
      try {
        sessionStorage.setItem('mikhmon_token', token);
      } catch {}
    }
  }
  return token;
};

export const getAuthUser = (): string => {
  if (typeof window === 'undefined') return 'admin';
  const user = localStorage.getItem('mikhmon_user') || sessionStorage.getItem('mikhmon_user') || 'admin';
  if (user && !sessionStorage.getItem('mikhmon_user')) {
    try {
      sessionStorage.setItem('mikhmon_user', user);
    } catch {}
  }
  return user;
};

export const clearAuthSession = () => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('mikhmon_token');
    sessionStorage.removeItem('mikhmon_user');
    localStorage.removeItem('mikhmon_token');
    localStorage.removeItem('mikhmon_user');
    localStorage.removeItem('mikhmon_remember');
  } catch {}
};

