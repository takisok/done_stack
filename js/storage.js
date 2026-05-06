/* =====================================================
   storage.js — データ永続化
   IndexedDB を優先し、使えない場合は localStorage にフォールバック。
   外部から使う関数: storageLoad / storageSave / storageUpdate / storageDelete
   ===================================================== */

const DB_NAME = 'done_stack_v1';
const DB_VER  = 1;
const STORE   = 'items';
const LS_KEY  = 'done_stack_items';

let db     = null;
let useIDB = true;   // IndexedDB が使えないと判明したら false に切り替わる

// ── IndexedDB 低レベル操作 ──────────────────────────

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);

    req.onerror = () => reject(req.error);

    req.onsuccess = () => {
      db = req.result;
      resolve(db);
    };

    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORE)) {
        d.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function dbGetAll() {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function dbAdd(item) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).add(item);
    req.onsuccess = () => resolve(req.result);  // 生成されたキーを返す
    req.onerror   = () => reject(req.error);
  });
}

function dbPut(item) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function dbDelete(id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function dbReplaceId(oldId, item) {
  await dbPut(item);
  await dbDelete(oldId);
}

// ── localStorage フォールバック ────────────────────

function lsLoad() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '[]');
  } catch {
    return [];
  }
}

function lsSave(arr) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch { /* 容量超過などは無視 */ }
}

function storageCreateId() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();

  if (cryptoApi?.getRandomValues) {
    const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0'));
    return [
      hex.slice(0, 4).join(''),
      hex.slice(4, 6).join(''),
      hex.slice(6, 8).join(''),
      hex.slice(8, 10).join(''),
      hex.slice(10, 16).join(''),
    ].join('-');
  }

  return `fallback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function storageNeedsIdMigration(item) {
  return typeof item.id !== 'string' || !item.id.includes('-');
}

async function storageNormalizeIds(items) {
  const migrated = [];

  for (const item of items) {
    if (!storageNeedsIdMigration(item)) {
      migrated.push(item);
      continue;
    }

    const oldId = item.id;
    const nextItem = { ...item, id: storageCreateId() };
    migrated.push(nextItem);

    try {
      if (useIDB && db) {
        await dbReplaceId(oldId, nextItem);
      }
    } catch (e) {
      console.warn('[storage] ID migration failed:', e);
    }
  }

  if (!useIDB || !db) {
    lsSave(migrated);
  }

  return migrated;
}

// ── 統合ストレージ API（外部から呼ぶ） ─────────────

/**
 * 保存済みの全アイテムを読み込む。
 * IndexedDB が使えなければ localStorage から取得。
 */
async function storageLoad() {
  if (useIDB) {
    try {
      await openDB();
      return await storageNormalizeIds(await dbGetAll());
    } catch (e) {
      console.warn('[storage] IndexedDB unavailable, using localStorage:', e);
      useIDB = false;
      db = null;
    }
  }
  return await storageNormalizeIds(lsLoad());
}

/**
 * 新しいアイテムを保存し、払い出された ID を返す。
 * item は { text, createdAt } を持つオブジェクト。
 */
async function storageSave(item) {
  const id = item.id || storageCreateId();
  const savedItem = { id, text: item.text, createdAt: item.createdAt };

  if (useIDB && db) {
    await dbAdd(savedItem);
    return id;
  }
  const arr = lsLoad();
  arr.push(savedItem);
  lsSave(arr);
  return id;
}

/**
 * 既存アイテムを上書き保存する。
 * item は id を含むこと。
 */
async function storageUpdate(item) {
  if (useIDB && db) {
    await dbPut(item);
    return;
  }
  const arr = lsLoad();
  const idx = arr.findIndex(x => x.id === item.id);
  if (idx > -1) arr[idx] = item;
  lsSave(arr);
}

/**
 * 指定 id のアイテムを削除する。
 */
async function storageDelete(id) {
  if (useIDB && db) {
    await dbDelete(id);
    return;
  }
  lsSave(lsLoad().filter(x => x.id !== id));
}
