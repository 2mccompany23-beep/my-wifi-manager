// Utilitaire de gestion des Notifications Web Push (PWA) pour l'Admin

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return registration;
  } catch (err) {
    console.warn('[PWA] Erreur enregistrement service worker:', err);
    return null;
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch (err) {
    console.warn('[PWA] Erreur récupération souscription:', err);
    return null;
  }
}

export async function subscribeToPushNotifications(token: string): Promise<{ success: boolean; message: string }> {
  if (!isPushSupported()) {
    return { success: false, message: "Les notifications Web Push ne sont pas supportées par ce navigateur." };
  }

  try {
    // 1. Demande de permission native au navigateur
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, message: "Permission de notification refusée dans le navigateur." };
    }

    // 2. Enregistrement du Service Worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, message: "Impossible d'activer le Service Worker PWA." };
    }

    // 3. Récupération de la clé VAPID publique depuis le serveur
    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) {
      throw new Error("Impossible de récupérer la clé VAPID du serveur");
    }
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      throw new Error("Clé VAPID publique manquante sur le serveur");
    }

    // 4. Souscription auprès du service Push (Google FCM / Apple APNs / Mozilla)
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any
      });
    }

    // 5. Enregistrement de la souscription sur le serveur
    const subRes = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ subscription })
    });

    if (!subRes.ok) {
      throw new Error("Échec de l'enregistrement de l'abonnement sur le serveur");
    }

    return { success: true, message: "Notifications Push activées avec succès sur cet appareil !" };
  } catch (err: any) {
    console.error('[PWA] Erreur souscription push:', err);
    return { success: false, message: err.message || "Erreur lors de l'activation des notifications." };
  }
}

export async function unsubscribeFromPushNotifications(token: string): Promise<{ success: boolean; message: string }> {
  if (!isPushSupported()) return { success: true, message: 'Non supporté' };

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ endpoint: subscription.endpoint })
      });
    }
    return { success: true, message: "Notifications Push désactivées pour cet appareil." };
  } catch (err: any) {
    console.error('[PWA] Erreur désabonnement push:', err);
    return { success: false, message: err.message || "Erreur lors de la désactivation." };
  }
}

export async function sendTestPushNotification(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/push/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Erreur lors de l'envoi");
    }
    const data = await res.json();
    return {
      success: true,
      message: `Notification envoyée avec succès à ${data.sent} appareil(s) admin !`
    };
  } catch (err: any) {
    return { success: false, message: err.message || "Impossible d'envoyer la notification test." };
  }
}
