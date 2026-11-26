/**
 * Module d'identification intelligente des marques et modèles de smartphones
 * pour le Kiosk Électoral ABH 2026 (MikroTik RB951Ui-2HnD)
 *
 * Combine 3 sources :
 * 1. Analyse du nom d'hôte DHCP MikroTik (Option 12)
 * 2. Empreinte du User-Agent HTTP du navigateur (portail captif & API vote)
 * 3. Base OUI des préfixes MAC des principaux constructeurs (IEEE)
 */

// Préfixes OUI des constructeurs majeurs (spécifiquement calibrés pour le marché africain/béninois)
const MAC_OUI_MAP = {
  // Apple
  '00:03:93': { brand: 'Apple', icon: '🍏' },
  '00:05:02': { brand: 'Apple', icon: '🍏' },
  '00:0A:95': { brand: 'Apple', icon: '🍏' },
  '00:10:FA': { brand: 'Apple', icon: '🍏' },
  '00:14:51': { brand: 'Apple', icon: '🍏' },
  '00:17:F2': { brand: 'Apple', icon: '🍏' },
  '00:19:E3': { brand: 'Apple', icon: '🍏' },
  '00:1C:B3': { brand: 'Apple', icon: '🍏' },
  '00:1E:52': { brand: 'Apple', icon: '🍏' },
  '00:23:12': { brand: 'Apple', icon: '🍏' },
  '00:25:00': { brand: 'Apple', icon: '🍏' },
  '00:26:BB': { brand: 'Apple', icon: '🍏' },
  '18:AF:61': { brand: 'Apple', icon: '🍏' },
  '28:CF:E9': { brand: 'Apple', icon: '🍏' },
  '3C:07:54': { brand: 'Apple', icon: '🍏' },
  '40:B3:95': { brand: 'Apple', icon: '🍏' },
  '5C:95:AE': { brand: 'Apple', icon: '🍏' },
  '64:76:BA': { brand: 'Apple', icon: '🍏' },
  '70:3E:AC': { brand: 'Apple', icon: '🍏' },
  '7C:6D:62': { brand: 'Apple', icon: '🍏' },
  '88:66:5A': { brand: 'Apple', icon: '🍏' },
  'A4:C3:61': { brand: 'Apple', icon: '🍏' },
  'BC:D1:D3': { brand: 'Apple', icon: '🍏' },
  'C8:69:CD': { brand: 'Apple', icon: '🍏' },
  'D8:96:95': { brand: 'Apple', icon: '🍏' },
  'E4:CE:8F': { brand: 'Apple', icon: '🍏' },
  'F0:99:B6': { brand: 'Apple', icon: '🍏' },

  // Samsung
  '00:07:AB': { brand: 'Samsung', icon: '📱' },
  '00:12:47': { brand: 'Samsung', icon: '📱' },
  '00:15:B9': { brand: 'Samsung', icon: '📱' },
  '00:18:AF': { brand: 'Samsung', icon: '📱' },
  '00:21:D1': { brand: 'Samsung', icon: '📱' },
  '00:23:D7': { brand: 'Samsung', icon: '📱' },
  '08:37:3D': { brand: 'Samsung', icon: '📱' },
  '14:49:E0': { brand: 'Samsung', icon: '📱' },
  '24:4B:81': { brand: 'Samsung', icon: '📱' },
  '34:BE:00': { brand: 'Samsung', icon: '📱' },
  '48:44:F7': { brand: 'Samsung', icon: '📱' },
  '50:85:69': { brand: 'Samsung', icon: '📱' },
  '64:B3:10': { brand: 'Samsung', icon: '📱' },
  '78:40:E4': { brand: 'Samsung', icon: '📱' },
  '88:30:8A': { brand: 'Samsung', icon: '📱' },
  '94:65:2D': { brand: 'Samsung', icon: '📱' },
  'A0:0B:BA': { brand: 'Samsung', icon: '📱' },
  'B8:57:D8': { brand: 'Samsung', icon: '📱' },
  'C8:14:79': { brand: 'Samsung', icon: '📱' },
  'DC:71:44': { brand: 'Samsung', icon: '📱' },
  'E4:7C:F9': { brand: 'Samsung', icon: '📱' },
  'F4:7B:5E': { brand: 'Samsung', icon: '📱' },

  // Transsion Holdings (Tecno / Infinix / itel)
  '00:E0:4C': { brand: 'Transsion', icon: '⚡' },
  '04:79:70': { brand: 'Transsion', icon: '⚡' },
  '08:62:66': { brand: 'Transsion', icon: '⚡' },
  '14:2D:27': { brand: 'Transsion', icon: '⚡' },
  '20:F5:43': { brand: 'Transsion', icon: '⚡' },
  '28:41:53': { brand: 'Transsion', icon: '⚡' },
  '34:42:62': { brand: 'Transsion', icon: '⚡' },
  '44:6E:E5': { brand: 'Transsion', icon: '⚡' },
  '4C:4E:03': { brand: 'Transsion', icon: '⚡' },
  '60:AB:14': { brand: 'Transsion', icon: '⚡' },
  '78:02:F8': { brand: 'Transsion', icon: '⚡' },
  '80:EA:07': { brand: 'Transsion', icon: '⚡' },
  '90:06:28': { brand: 'Transsion', icon: '⚡' },
  'A4:C4:94': { brand: 'Transsion', icon: '⚡' },
  'B0:C5:59': { brand: 'Transsion', icon: '⚡' },
  'BC:39:7A': { brand: 'Transsion', icon: '⚡' },
  'D0:C5:D3': { brand: 'Transsion', icon: '⚡' },
  'E4:70:B8': { brand: 'Transsion', icon: '⚡' },
  'F8:A4:50': { brand: 'Transsion', icon: '⚡' },

  // Xiaomi / Redmi / POCO
  '00:9E:C8': { brand: 'Xiaomi', icon: '🔴' },
  '0C:98:38': { brand: 'Xiaomi', icon: '🔴' },
  '18:59:36': { brand: 'Xiaomi', icon: '🔴' },
  '28:6C:07': { brand: 'Xiaomi', icon: '🔴' },
  '34:80:0D': { brand: 'Xiaomi', icon: '🔴' },
  '3C:BD:3E': { brand: 'Xiaomi', icon: '🔴' },
  '50:8F:4C': { brand: 'Xiaomi', icon: '🔴' },
  '64:09:80': { brand: 'Xiaomi', icon: '🔴' },
  '78:02:F8': { brand: 'Xiaomi', icon: '🔴' },
  '8C:BE:BE': { brand: 'Xiaomi', icon: '🔴' },
  'AC:C1:EE': { brand: 'Xiaomi', icon: '🔴' },
  'D4:97:0B': { brand: 'Xiaomi', icon: '🔴' },
  'E4:46:DA': { brand: 'Xiaomi', icon: '🔴' },
  'F8:A4:5F': { brand: 'Xiaomi', icon: '🔴' },

  // Huawei / Honor
  '00:1E:10': { brand: 'Huawei', icon: '🔵' },
  '00:25:68': { brand: 'Huawei', icon: '🔵' },
  '04:25:28': { brand: 'Huawei', icon: '🔵' },
  '08:E8:4F': { brand: 'Huawei', icon: '🔵' },
  '10:51:72': { brand: 'Huawei', icon: '🔵' },
  '14:D1:1F': { brand: 'Huawei', icon: '🔵' },
  '24:DB:AC': { brand: 'Huawei', icon: '🔵' },
  '34:2E:B6': { brand: 'Huawei', icon: '🔵' },
  '48:46:FB': { brand: 'Huawei', icon: '🔵' },
  '70:72:3C': { brand: 'Huawei', icon: '🔵' },
  '88:86:03': { brand: 'Huawei', icon: '🔵' },
  'B0:5B:67': { brand: 'Huawei', icon: '🔵' },
  'CC:96:A0': { brand: 'Huawei', icon: '🔵' },
  'DC:D9:16': { brand: 'Huawei', icon: '🔵' },

  // Google (Pixel)
  '00:1A:11': { brand: 'Google', icon: '🔷' },
  '3C:5A:B4': { brand: 'Google', icon: '🔷' },
  '54:60:09': { brand: 'Google', icon: '🔷' },
  'E4:F0:42': { brand: 'Google', icon: '🔷' },

  // Oppo / Realme / OnePlus / Vivo (BBK Group)
  '04:D6:AA': { brand: 'Oppo', icon: '🟢' },
  '18:F0:E4': { brand: 'Oppo', icon: '🟢' },
  '2C:59:8A': { brand: 'Realme', icon: '🟡' },
  '3C:91:80': { brand: 'OnePlus', icon: '🔴' },
  '50:8A:06': { brand: 'Vivo', icon: '🔵' },
  '70:3A:51': { brand: 'Vivo', icon: '🔵' },
  '80:35:C1': { brand: 'Oppo', icon: '🟢' },
  'B4:0B:44': { brand: 'OnePlus', icon: '🔴' },

  // Motorola / Lenovo
  '00:0C:E5': { brand: 'Motorola', icon: '🦇' },
  '14:30:04': { brand: 'Motorola', icon: '🦇' },
  '40:88:05': { brand: 'Lenovo', icon: '💻' },
  '70:70:8B': { brand: 'Lenovo', icon: '💻' }
};

/**
 * Analyse le nom d'hôte DHCP MikroTik (Option 12)
 */
function parseHostname(rawHostname) {
  if (!rawHostname || typeof rawHostname !== 'string') return null;
  const h = rawHostname.trim();
  if (!h || h === 'Appareil Mobile' || h.startsWith('Appareil Mobile (')) return null;

  const upper = h.toUpperCase();

  // 1. Apple iPhone / iPad / Mac
  if (upper.includes('IPHONE')) {
    const cleanName = h.replace(/[-_]/g, ' ');
    return { brand: 'Apple', model: cleanName, icon: '🍏', displayName: `🍏 ${cleanName}` };
  }
  if (upper.includes('IPAD')) {
    return { brand: 'Apple', model: 'iPad', icon: '🍏', displayName: '🍏 Apple iPad' };
  }
  if (upper.includes('MACBOOK') || upper.includes('MAC-') || upper.includes('IMAC')) {
    return { brand: 'Apple', model: 'MacBook', icon: '🍏', displayName: '🍏 Apple Mac' };
  }

  // 2. Transsion : Tecno
  if (upper.includes('TECNO')) {
    const model = h.replace(/^[Tt][Ee][Cc][Nn][Oo][-_]?/, '').replace(/[-_]/g, ' ').trim() || 'Mobile';
    return { brand: 'Tecno', model: `Spark / Camon ${model}`, icon: '⚡', displayName: `⚡ Tecno ${model}` };
  }

  // 3. Transsion : Infinix
  if (upper.includes('INFINIX')) {
    const model = h.replace(/^[Ii][Nn][Ff][Ii][Nn][Ii][Xx][-_]?/, '').replace(/[-_]/g, ' ').trim() || 'Mobile';
    return { brand: 'Infinix', model: `Hot / Smart ${model}`, icon: '🔥', displayName: `🔥 Infinix ${model}` };
  }

  // 4. Transsion : itel
  if (upper.includes('ITEL')) {
    const model = h.replace(/^[Ii][Tt][Ee][Ll][-_]?/, '').replace(/[-_]/g, ' ').trim() || 'Mobile';
    return { brand: 'itel', model: `Vision / A-Series ${model}`, icon: '🟡', displayName: `🟡 itel ${model}` };
  }

  // 5. Samsung Galaxy
  if (upper.includes('GALAXY') || upper.startsWith('SM-') || upper.includes('SAMSUNG')) {
    let model = h.replace(/[-_]/g, ' ').replace(/^SAMSUNG\s+/i, '');
    return { brand: 'Samsung', model: model, icon: '📱', displayName: `📱 Samsung ${model}` };
  }

  // 6. Xiaomi / Redmi / POCO
  if (upper.includes('REDMI')) {
    const model = h.replace(/[-_]/g, ' ');
    return { brand: 'Xiaomi', model: model, icon: '🔴', displayName: `🔴 ${model}` };
  }
  if (upper.includes('POCO')) {
    const model = h.replace(/[-_]/g, ' ');
    return { brand: 'POCO', model: model, icon: '🟡', displayName: `🟡 ${model}` };
  }
  if (upper.includes('XIAOMI')) {
    const model = h.replace(/[-_]/g, ' ');
    return { brand: 'Xiaomi', model: model, icon: '🔴', displayName: `🔴 ${model}` };
  }

  // 7. Huawei / Honor
  if (upper.includes('HUAWEI') || upper.includes('HONOR')) {
    const model = h.replace(/[-_]/g, ' ');
    return { brand: 'Huawei', model: model, icon: '🔵', displayName: `🔵 ${model}` };
  }

  // 8. Oppo / Vivo / Realme / OnePlus
  if (upper.includes('OPPO')) return { brand: 'Oppo', model: h.replace(/[-_]/g, ' '), icon: '🟢', displayName: `🟢 ${h}` };
  if (upper.includes('VIVO')) return { brand: 'Vivo', model: h.replace(/[-_]/g, ' '), icon: '🔵', displayName: `🔵 ${h}` };
  if (upper.includes('REALME')) return { brand: 'Realme', model: h.replace(/[-_]/g, ' '), icon: '🟡', displayName: `🟡 ${h}` };
  if (upper.includes('ONEPLUS')) return { brand: 'OnePlus', model: h.replace(/[-_]/g, ' '), icon: '🔴', displayName: `🔴 ${h}` };

  // 9. Google Pixel
  if (upper.includes('PIXEL')) return { brand: 'Google', model: h.replace(/[-_]/g, ' '), icon: '🔷', displayName: `🔷 Google ${h}` };

  // Autre nom d'hôte valide
  return { brand: 'Android', model: h.replace(/[-_]/g, ' '), icon: '📱', displayName: `📱 ${h.replace(/[-_]/g, ' ')}` };
}

/**
 * Analyse le User-Agent HTTP envoyé par le navigateur de l'étudiant
 */
function parseUserAgent(ua) {
  if (!ua || typeof ua !== 'string') return null;

  // iOS (iPhone, iPad, iPod)
  if (/iPhone/i.test(ua)) {
    const osMatch = ua.match(/OS (\d+[_\.]\d+)/i);
    const osVer = osMatch ? `iOS ${osMatch[1].replace('_', '.')}` : 'iOS';
    return { brand: 'Apple', model: 'iPhone', os: osVer, icon: '🍏', displayName: `🍏 Apple iPhone (${osVer})` };
  }
  if (/iPad/i.test(ua)) {
    return { brand: 'Apple', model: 'iPad', os: 'iPadOS', icon: '🍏', displayName: '🍏 Apple iPad' };
  }

  // Android
  if (/Android/i.test(ua)) {
    const verMatch = ua.match(/Android\s+([\d\.]+)/i);
    const androidVer = verMatch ? `Android ${verMatch[1]}` : 'Android';

    // Recherche de modèles spécifiques dans le User-Agent (ex: "Build/SM-A135F", "Build/TECNO-KI5k", etc.)
    const modelMatch = ua.match(/;\s*([A-Za-z0-9\s\-_]+)\s+Build/i);
    const rawModel = modelMatch ? modelMatch[1].trim() : '';

    if (rawModel) {
      const parsed = parseHostname(rawModel);
      if (parsed) {
        return {
          brand: parsed.brand,
          model: parsed.model,
          os: androidVer,
          icon: parsed.icon,
          displayName: `${parsed.displayName} (${androidVer})`
        };
      }
      return { brand: 'Android', model: rawModel, os: androidVer, icon: '📱', displayName: `📱 ${rawModel} (${androidVer})` };
    }

    return { brand: 'Android', model: 'Smartphone', os: androidVer, icon: '📱', displayName: `📱 Android (${androidVer})` };
  }

  // Windows / Mac
  if (/Windows/i.test(ua)) return { brand: 'PC Windows', model: 'Ordinateur', os: 'Windows', icon: '💻', displayName: '💻 Ordinateur Windows' };
  if (/Macintosh/i.test(ua)) return { brand: 'Apple Mac', model: 'MacBook/iMac', os: 'macOS', icon: '🍏', displayName: '🍏 Apple Mac' };

  return null;
}

/**
 * Analyse l'adresse MAC selon l'OUI et la randomisation
 */
function parseMacAddress(mac) {
  if (!mac || typeof mac !== 'string') return null;
  const clean = mac.trim().toUpperCase().replace(/[:-]/g, ':');
  if (clean.length < 8) return null;

  const prefix = clean.slice(0, 8);
  const isRandomized = isMacRandomized(clean);

  const matched = MAC_OUI_MAP[prefix];
  if (matched) {
    return {
      brand: matched.brand,
      model: isRandomized ? `${matched.brand} (MAC Privée)` : `${matched.brand} Mobile`,
      icon: matched.icon,
      isRandomized
    };
  }

  if (isRandomized) {
    return { brand: 'Mobile', model: 'Smartphone (MAC Privée)', icon: '🔒', isRandomized: true };
  }

  return null;
}

/**
 * Détecte si une adresse MAC est randomisée (bit U/L à 1 sur le 1er octet)
 * ex: x2:xx:xx, x6:xx:xx, xA:xx:xx, xE:xx:xx
 */
function isMacRandomized(mac) {
  try {
    const firstOctet = parseInt(mac.slice(0, 2), 16);
    return (firstOctet & 0x02) !== 0;
  } catch (_) {
    return false;
  }
}

/**
 * Fonction maîtresse : Identifie un appareil en combinant toutes les sources disponibles
 *
 * @param {Object} params
 * @param {string} [params.mac] - Adresse MAC du client
 * @param {string} [params.hostname] - Nom d'hôte DHCP retourné par RouterOS
 * @param {string} [params.userAgent] - En-tête User-Agent HTTP du navigateur
 * @param {number} [params.routerId] - Identifiant du routeur (1 ou 2)
 * @returns {Object} { brand, model, icon, displayName, isRandomized }
 */
export function identifyDevice({ mac = '', hostname = '', userAgent = '', routerId = 1 } = {}) {
  // 1. Priorité 1 : Le User-Agent (donne l'OS précis et le modèle réel du navigateur)
  const fromUa = parseUserAgent(userAgent);

  // 2. Priorité 2 : Le nom d'hôte DHCP MikroTik (donne le modèle constructeur configuré)
  const fromHost = parseHostname(hostname);

  // 3. Priorité 3 : L'OUI de l'adresse MAC
  const fromMac = parseMacAddress(mac);

  // Si on a à la fois le User-Agent et le nom DHCP
  if (fromHost && fromUa && fromHost.brand !== 'Android') {
    return {
      brand: fromHost.brand,
      model: fromHost.model,
      icon: fromHost.icon,
      displayName: `${fromHost.displayName} [${fromUa.os || 'Mobile'}]`,
      isRandomized: fromMac?.isRandomized || false
    };
  }

  if (fromHost) {
    return {
      brand: fromHost.brand,
      model: fromHost.model,
      icon: fromHost.icon,
      displayName: fromHost.displayName,
      isRandomized: fromMac?.isRandomized || false
    };
  }

  if (fromUa) {
    return {
      brand: fromUa.brand,
      model: fromUa.model,
      icon: fromUa.icon,
      displayName: fromUa.displayName,
      isRandomized: fromMac?.isRandomized || false
    };
  }

  if (fromMac && fromMac.brand !== 'Mobile') {
    return {
      brand: fromMac.brand,
      model: fromMac.model,
      icon: fromMac.icon,
      displayName: `${fromMac.icon} ${fromMac.brand} Mobile`,
      isRandomized: fromMac.isRandomized
    };
  }

  const routerSuffix = routerId === 2 ? 'R2' : 'R1';
  return {
    brand: 'Smartphone',
    model: 'Mobile',
    icon: '📱',
    displayName: `📱 Smartphone Étudiant (${routerSuffix})`,
    isRandomized: fromMac?.isRandomized || false
  };
}
