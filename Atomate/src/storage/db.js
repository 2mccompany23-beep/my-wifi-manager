const { DatabaseSync } = require('node:sqlite');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class EncryptedStorage {
  constructor(dbPath, keyPath) {
    this.dbPath = dbPath;
    this.keyPath = keyPath;
    this.encryptionKey = null;
    this.db = null;
    this.init();
  }

  init() {
    const dataDir = path.dirname(this.dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 1. Initialize or load the master encryption key
    this.initMasterKey();

    // 2. Initialize SQLite database
    this.db = new DatabaseSync(this.dbPath);

    // 3. Create table if not exists
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS encrypted_fields (
        key TEXT PRIMARY KEY,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        ciphertext TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  }

  initMasterKey() {
    if (fs.existsSync(this.keyPath)) {
      this.encryptionKey = fs.readFileSync(this.keyPath);
    } else {
      // Generate a cryptographically secure 256-bit key
      this.encryptionKey = crypto.randomBytes(32);
      fs.writeFileSync(this.keyPath, this.encryptionKey, { mode: 0o600 });
    }
  }

  // Encrypt using AES-256-GCM
  encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined) {
      plaintext = '';
    }
    const textToEncrypt = String(plaintext);
    const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    let ciphertext = cipher.update(textToEncrypt, 'utf8', 'hex');
    ciphertext += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      ciphertext: ciphertext
    };
  }

  // Decrypt using AES-256-GCM
  decrypt(ivHex, authTagHex, ciphertextHex) {
    try {
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (err) {
      // In case of integrity failure or tampering
      return null;
    }
  }

  // Save single field with automatic encryption
  saveField(key, value) {
    const encrypted = this.encrypt(value);
    const stmt = this.db.prepare(`
      INSERT INTO encrypted_fields (key, iv, auth_tag, ciphertext, updated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        iv = excluded.iv,
        auth_tag = excluded.auth_tag,
        ciphertext = excluded.ciphertext,
        updated_at = excluded.updated_at
    `);

    stmt.run(key, encrypted.iv, encrypted.authTag, encrypted.ciphertext, Date.now());
  }

  // Load single field with decryption
  loadField(key) {
    const stmt = this.db.prepare(`SELECT iv, auth_tag, ciphertext FROM encrypted_fields WHERE key = ?`);
    const row = stmt.get(key);
    if (!row) return null;
    return this.decrypt(row.iv, row.auth_tag, row.ciphertext);
  }

  // Load all fields with decryption
  loadAllFields() {
    const stmt = this.db.prepare(`SELECT key, iv, auth_tag, ciphertext FROM encrypted_fields`);
    const rows = stmt.all();
    const result = {};
    for (const row of rows) {
      result[row.key] = this.decrypt(row.iv, row.auth_tag, row.ciphertext);
    }
    return result;
  }

  close() {
    if (this.db) {
      try {
        this.db.close();
      } catch (e) {}
    }
  }
}

module.exports = EncryptedStorage;
