import net from 'net';

/**
 * Client natif RouterOS v7 Binary API (Port 8728)
 * Conçu spécifiquement pour MikroTik RouterOS v6 / v7 sans dépendance externe.
 */
export class RouterOSClient {
  constructor(options = {}) {
    this.host = options.host || '192.168.88.1';
    this.port = parseInt(options.port) || 8728;
    this.user = options.user || 'admin';
    this.password = options.password || '4ZFF63YJ4H';
    this.timeout = options.timeout || 10000;
  }

  static encodeWord(str) {
    const b = Buffer.from(str, 'utf8');
    const len = b.length;
    if (len < 0x80) {
      return Buffer.concat([Buffer.from([len]), b]);
    } else if (len < 0x4000) {
      return Buffer.concat([Buffer.from([(len >> 8) | 0x80, len & 0xff]), b]);
    } else if (len < 0x200000) {
      return Buffer.concat([Buffer.from([(len >> 16) | 0xc0, (len >> 8) & 0xff, len & 0xff]), b]);
    }
    return Buffer.concat([Buffer.from([0x80, len]), b]);
  }

  static decodeLength(buffer, offset) {
    if (offset >= buffer.length) return null;
    const b1 = buffer[offset];
    if ((b1 & 0x80) === 0) {
      return { len: b1, bytesRead: 1 };
    } else if ((b1 & 0xC0) === 0x80) {
      if (offset + 1 >= buffer.length) return null;
      return { len: ((b1 & 0x3F) << 8) | buffer[offset + 1], bytesRead: 2 };
    } else if ((b1 & 0xE0) === 0xC0) {
      if (offset + 2 >= buffer.length) return null;
      return { len: ((b1 & 0x1F) << 16) | (buffer[offset + 1] << 8) | buffer[offset + 2], bytesRead: 3 };
    } else if ((b1 & 0xF0) === 0xE0) {
      if (offset + 3 >= buffer.length) return null;
      return { len: ((b1 & 0x0F) << 24) | (buffer[offset + 1] << 16) | (buffer[offset + 2] << 8) | buffer[offset + 3], bytesRead: 4 };
    }
    return null;
  }

  static parseSentences(buffer) {
    const sentences = [];
    let offset = 0;
    let currentWords = [];

    while (offset < buffer.length) {
      const lRes = RouterOSClient.decodeLength(buffer, offset);
      if (!lRes) break;

      const { len, bytesRead } = lRes;
      if (offset + bytesRead + len > buffer.length) break;

      if (len === 0) {
        sentences.push(currentWords);
        currentWords = [];
        offset += bytesRead;
      } else {
        const wordBuf = buffer.slice(offset + bytesRead, offset + bytesRead + len);
        currentWords.push(wordBuf.toString('utf8'));
        offset += bytesRead + len;
      }
    }
    return { sentences, bytesConsumed: offset };
  }

  /**
   * Exécute une commande ou requête sur l'API RouterOS
   * @param {string} command Ex: "/ip/hotspot/host/print" ou "/system/reboot"
   * @param {Array<string>} words Arguments supplémentaires ex: ["=.id=*1", "=name=test"]
   */
  execute(command, words = []) {
    return new Promise((resolve, reject) => {
      // Si words est un objet (ex: { number: 'kiosk_auto_user' }), le convertir en array de mots RouterOS
      let formattedWords = [];
      if (Array.isArray(words)) {
        formattedWords = words;
      } else if (words && typeof words === 'object') {
        formattedWords = Object.entries(words).map(([k, v]) => `=${k}=${v}`);
      }
      const socket = new net.Socket();
      let buffer = Buffer.alloc(0);
      let isLogged = false;
      const parsedItems = [];
      let timer = null;

      const cleanup = () => {
        if (timer) clearTimeout(timer);
        try { socket.destroy(); } catch (_) { }
      };

      timer = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout (${this.timeout}ms) sur RouterOS API (${this.host}:${this.port})`));
      }, this.timeout);

      const sendSentence = (sentenceWords) => {
        let buf = Buffer.alloc(0);
        for (const w of sentenceWords) {
          buf = Buffer.concat([buf, RouterOSClient.encodeWord(w)]);
        }
        buf = Buffer.concat([buf, Buffer.from([0])]);
        socket.write(buf);
      };

      socket.connect(this.port, this.host, () => {
        sendSentence(['/login', `=name=${this.user}`, `=password=${this.password}`]);
      });

      socket.on('data', (chunk) => {
        buffer = Buffer.concat([buffer, chunk]);
        const { sentences, bytesConsumed } = RouterOSClient.parseSentences(buffer);

        if (bytesConsumed > 0) {
          buffer = buffer.slice(bytesConsumed);
        }

        for (const sentence of sentences) {
          if (sentence.length === 0) continue;
          const replyType = sentence[0];

          if (!isLogged) {
            if (replyType === '!done') {
              isLogged = true;
              sendSentence([command, ...formattedWords]);
            } else if (replyType === '!trap') {
              cleanup();
              let msg = 'Authentification RouterOS rejetée';
              for (const w of sentence) {
                if (w.startsWith('=message=')) msg = w.substring(9);
              }
              return reject(new Error(msg));
            }
          } else {
            if (replyType === '!re') {
              const item = {};
              for (let i = 1; i < sentence.length; i++) {
                const word = sentence[i];
                const clean = word.startsWith('=') ? word.substring(1) : word;
                const eqIdx = clean.indexOf('=');
                if (eqIdx !== -1) {
                  item[clean.substring(0, eqIdx)] = clean.substring(eqIdx + 1);
                }
              }
              if (Object.keys(item).length > 0) parsedItems.push(item);
            } else if (replyType === '!done') {
              cleanup();
              return resolve(parsedItems);
            } else if (replyType === '!trap') {
              cleanup();
              let msg = 'Erreur commande RouterOS';
              for (const w of sentence) {
                if (w.startsWith('=message=')) msg = w.substring(9);
              }
              return reject(new Error(msg));
            }
          }
        }
      });

      socket.on('error', (err) => {
        cleanup();
        reject(new Error(`Socket RouterOS API: ${err.message}`));
      });
    });
  }

  // --- Helpers de haut niveau ---

  async print(path, queries = []) {
    const fullCmd = path.endsWith('/print') ? path : `${path}/print`;
    return this.execute(fullCmd, queries);
  }

  async add(path, data = {}) {
    const fullCmd = path.endsWith('/add') ? path : `${path}/add`;
    const words = Object.entries(data).map(([k, v]) => `=${k}=${v}`);
    return this.execute(fullCmd, words);
  }

  async set(path, id, data = {}) {
    const fullCmd = path.endsWith('/set') ? path : `${path}/set`;
    const words = [`=.id=${id}`, ...Object.entries(data).map(([k, v]) => `=${k}=${v}`)];
    return this.execute(fullCmd, words);
  }

  async remove(path, id) {
    const fullCmd = path.endsWith('/remove') ? path : `${path}/remove`;
    return this.execute(fullCmd, [`=.id=${id}`]);
  }

  async getResource() {
    const res = await this.print('/system/resource');
    return res[0] || null;
  }
}

