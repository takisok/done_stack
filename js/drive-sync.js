/* =====================================================
   drive-sync.js — Google Drive 同期
   GitHub Pages などの静的ホスティングで使うため、Google Identity Services
   と Drive API をブラウザから直接利用する。
   ===================================================== */

const DONE_STACK_GOOGLE_CLIENT_ID = '257635604882-j8gd624eici7m8b6ickt84ttsrmro0vh.apps.googleusercontent.com';
const DRIVE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const DRIVE_FILE_NAME = 'done_stack.json';
const DRIVE_CONNECTED_KEY = 'done_stack_drive_connected';
const DRIVE_MAX_PAYLOAD_BYTES = 20 * 1024 * 1024;
const DRIVE_MAX_ITEMS = 100000;
const DRIVE_MAX_DELETED_ITEMS = 100000;
const DRIVE_MAX_TEXT_LENGTH = 1024;
const DRIVE_MAX_DATE_LENGTH = 40;

(function setupDriveSync() {
  let tokenClient = null;
  let gapiReady = false;
  let gisReady = false;
  let signedIn = false;
  let syncTimer = null;
  let syncInFlight = false;
  let syncQueued = false;
  let hooks = {
    getItems: () => [],
    applyItems: () => {},
    statusEl: null,
    showToast: () => {},
  };

  function getClientId() {
    return window.DONE_STACK_GOOGLE_CLIENT_ID || DONE_STACK_GOOGLE_CLIENT_ID;
  }

  function setStatus(state, label) {
    if (!hooks.statusEl) return;
    hooks.statusEl.dataset.state = state;
    hooks.statusEl.textContent = label;
  }

  function rememberConnected() {
    try {
      localStorage.setItem(DRIVE_CONNECTED_KEY, '1');
    } catch { /* localStorage unavailable */ }
  }

  function hasConnectionHint() {
    try {
      return localStorage.getItem(DRIVE_CONNECTED_KEY) === '1';
    } catch {
      return false;
    }
  }

  function waitForGlobal(name, timeout = 8000) {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        if (window[name]) {
          resolve(window[name]);
          return;
        }
        if (Date.now() - start > timeout) {
          reject(new Error(`${name} の読み込みがタイムアウトしました。`));
          return;
        }
        setTimeout(tick, 80);
      };
      tick();
    });
  }

  function formatBytes(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)}KB`;
    return `${bytes}B`;
  }

  function driveError(messageJa, messageEn, details = {}) {
    const error = new Error(I18N.getLanguage() === 'en' ? messageEn : messageJa);
    error.driveDetails = details;
    return error;
  }

  function summarizeValidation(summary) {
    const parts = [];
    if (summary.itemsOverLimit > 0) {
      parts.push(I18N.getLanguage() === 'en'
        ? `${summary.itemsOverLimit} Done entries exceeded the item limit`
        : `Done件数が上限を${summary.itemsOverLimit}件超えています`);
    }
    if (summary.invalidItems > 0) {
      parts.push(I18N.getLanguage() === 'en'
        ? `${summary.invalidItems} Done entries had invalid data`
        : `${summary.invalidItems}件のDoneに不正なデータがあります`);
    }
    if (summary.truncatedTexts > 0) {
      parts.push(I18N.getLanguage() === 'en'
        ? `${summary.truncatedTexts} Done entries were longer than ${DRIVE_MAX_TEXT_LENGTH} characters`
        : `${summary.truncatedTexts}件のDone本文が${DRIVE_MAX_TEXT_LENGTH}文字を超えています`);
    }
    if (summary.deletedOverLimit > 0) {
      parts.push(I18N.getLanguage() === 'en'
        ? `${summary.deletedOverLimit} delete-log entries exceeded the limit`
        : `削除ログが上限を${summary.deletedOverLimit}件超えています`);
    }
    if (summary.invalidDeletes > 0) {
      parts.push(I18N.getLanguage() === 'en'
        ? `${summary.invalidDeletes} delete-log entries had invalid dates`
        : `${summary.invalidDeletes}件の削除ログの日付が不正です`);
    }
    return parts;
  }

  async function ensureGoogleClients() {
    const clientId = getClientId();
    if (!clientId) {
      setStatus('setup', 'Drive 設定待ち');
      throw new Error(I18N.getLanguage() === 'en'
        ? 'Google Drive sync requires a Google OAuth client ID.'
        : 'Google Drive 同期には Google OAuth クライアントIDの設定が必要です。');
    }

    if (!gapiReady) {
      const gapi = await waitForGlobal('gapi');
      await new Promise((resolve) => gapi.load('client', resolve));
      await gapi.client.init({ discoveryDocs: [DRIVE_DISCOVERY_DOC] });
      gapiReady = true;
    }

    if (!gisReady) {
      await waitForGlobal('google');
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: DRIVE_SCOPE,
        callback: () => {},
      });
      gisReady = true;
    }
  }

  async function signIn(options = {}) {
    const prompt = options.prompt ?? (signedIn ? '' : 'consent');
    const silent = Boolean(options.silent);

    try {
      await ensureGoogleClients();
      await new Promise((resolve, reject) => {
        tokenClient.callback = (response) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }
          signedIn = true;
          rememberConnected();
          setStatus('on', 'Drive 接続中');
          resolve();
        };
        tokenClient.requestAccessToken({ prompt });
      });
      if (!silent) hooks.showToast(I18N.getLanguage() === 'en' ? 'Connected to Google Drive' : 'Google Drive に接続しました');
      return true;
    } catch (error) {
      console.warn('[drive-sync] sign in failed:', error);
      if (!silent) {
        setStatus('error', 'Drive 接続不可');
        alert(error.message || (I18N.getLanguage() === 'en' ? 'Failed to connect to Google Drive.' : 'Google Drive への接続に失敗しました。'));
      }
      return false;
    }
  }

  async function findDriveFile() {
    const response = await gapi.client.drive.files.list({
      spaces: 'appDataFolder',
      q: `name='${DRIVE_FILE_NAME}' and trashed=false`,
      fields: 'files(id,name,modifiedTime)',
      pageSize: 1,
    });
    return response.result.files?.[0] || null;
  }

  async function readRemotePayload(fileId) {
    if (!fileId) return null;
    const response = await gapi.client.drive.files.get({
      fileId,
      alt: 'media',
    });
    if (typeof response.body === 'string') {
      const remoteSize = new Blob([response.body]).size;
      if (remoteSize > DRIVE_MAX_PAYLOAD_BYTES) {
        throw driveError(
          `Drive上のデータが大きすぎるため同期できません。\n現在: ${formatBytes(remoteSize)} / 上限: ${formatBytes(DRIVE_MAX_PAYLOAD_BYTES)}`,
          `Drive data is too large to sync.\nCurrent: ${formatBytes(remoteSize)} / Limit: ${formatBytes(DRIVE_MAX_PAYLOAD_BYTES)}`,
          { code: 'remote-size-limit', remoteSize },
        );
      }
      try {
        return JSON.parse(response.body);
      } catch (error) {
        throw driveError(
          'Drive上のdone_stack.jsonがJSONとして読み取れません。Drive側の同期データが壊れている可能性があります。',
          'The Drive done_stack.json file is not valid JSON. The remote sync data may be corrupted.',
          { code: 'remote-json-invalid', cause: error },
        );
      }
    }
    return response.result;
  }

  async function uploadPayload(fileId, payload) {
    const accessToken = gapi.client.getToken()?.access_token;
    if (!accessToken) throw new Error(I18N.getLanguage() === 'en' ? 'Google Drive access token is missing.' : 'Google Drive のアクセストークンがありません。');

    const metadata = {
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
    };

    if (!fileId) {
      metadata.parents = ['appDataFolder'];
    }

    const payloadText = JSON.stringify(payload);
    const payloadSize = new Blob([payloadText]).size;
    if (payloadSize > DRIVE_MAX_PAYLOAD_BYTES) {
      throw driveError(
        `Doneデータが大きすぎるため同期できません。\n現在: ${formatBytes(payloadSize)} / 上限: ${formatBytes(DRIVE_MAX_PAYLOAD_BYTES)}`,
        `Done data is too large to sync.\nCurrent: ${formatBytes(payloadSize)} / Limit: ${formatBytes(DRIVE_MAX_PAYLOAD_BYTES)}`,
        { code: 'local-size-limit', payloadSize },
      );
    }

    const delimiter = '-------done-stack-boundary';
    const body = [
      `--${delimiter}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${delimiter}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      payloadText,
      `--${delimiter}--`,
    ].join('\r\n');

    const method = fileId ? 'PATCH' : 'POST';
    const target = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(fileId)}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

    const response = await fetch(target, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${delimiter}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(I18N.getLanguage() === 'en' ? `Drive save failed (${response.status})` : `Drive 保存に失敗しました (${response.status})`);
    }
  }

  function normalizeItems(items) {
    return normalizeItemsWithSummary(items).items;
  }

  function normalizeItemsWithSummary(items) {
    const source = Array.isArray(items) ? items : [];
    const summary = {
      itemsOverLimit: Math.max(0, source.length - DRIVE_MAX_ITEMS),
      invalidItems: 0,
      truncatedTexts: 0,
    };
    const normalized = [];

    source.slice(0, DRIVE_MAX_ITEMS).forEach((item) => {
      const doneAt = item?.doneAt || item?.createdAt;
      if (!item || !item.id || !item.text || !isValidSyncDate(item.createdAt) || !isValidSyncDate(doneAt)) {
        summary.invalidItems += 1;
        return;
      }
      const text = String(item.text);
      if (text.length > DRIVE_MAX_TEXT_LENGTH) summary.truncatedTexts += 1;
      normalized.push({
        id: String(item.id),
        text: text.slice(0, DRIVE_MAX_TEXT_LENGTH),
        createdAt: item.createdAt,
        doneAt,
        updatedAt: isValidSyncDate(item.updatedAt) ? item.updatedAt : item.createdAt,
      });
    });

    return { items: normalized, summary };
  }

  function isValidSyncDate(value) {
    if (typeof value !== 'string') return false;
    const time = Date.parse(value);
    return Number.isFinite(time) && value.length <= DRIVE_MAX_DATE_LENGTH;
  }

  function normalizeDeleteLog(log) {
    return normalizeDeleteLogWithSummary(log).deletedItems;
  }

  function normalizeDeleteLogWithSummary(log) {
    const entries = Object.entries(log || {});
    const summary = {
      deletedOverLimit: Math.max(0, entries.length - DRIVE_MAX_DELETED_ITEMS),
      invalidDeletes: 0,
    };
    const normalized = {};

    entries.slice(0, DRIVE_MAX_DELETED_ITEMS).forEach(([id, deletedAt]) => {
      if (!id || !isValidSyncDate(deletedAt)) {
        summary.invalidDeletes += 1;
        return;
      }
      normalized[String(id)] = deletedAt;
    });

    return { deletedItems: normalized, summary };
  }

  function newerDate(a, b) {
    return new Date(a || 0).getTime() >= new Date(b || 0).getTime();
  }

  function mergePayload(localItems, remotePayload) {
    const localNormalized = normalizeItemsWithSummary(localItems);
    const remoteNormalized = normalizeItemsWithSummary(remotePayload?.items || []);
    const localDeletedNormalized = normalizeDeleteLogWithSummary(storageGetSyncState().deletedItems);
    const remoteDeletedNormalized = normalizeDeleteLogWithSummary(remotePayload?.deletedItems);
    const remoteValidationMessages = summarizeValidation({
      itemsOverLimit: remoteNormalized.summary.itemsOverLimit,
      invalidItems: remoteNormalized.summary.invalidItems,
      truncatedTexts: remoteNormalized.summary.truncatedTexts,
      deletedOverLimit: remoteDeletedNormalized.summary.deletedOverLimit,
      invalidDeletes: remoteDeletedNormalized.summary.invalidDeletes,
    });
    if (remoteValidationMessages.length > 0) {
      throw driveError(
        `Drive上の同期データに問題があります。\n${remoteValidationMessages.join('\n')}`,
        `Drive sync data has validation problems.\n${remoteValidationMessages.join('\n')}`,
        { code: 'remote-validation', messages: remoteValidationMessages },
      );
    }

    const localDeleted = localDeletedNormalized.deletedItems;
    const remoteDeleted = remoteDeletedNormalized.deletedItems;
    const deletedItems = { ...remoteDeleted, ...localDeleted };
    const byId = new Map();

    localNormalized.items.concat(remoteNormalized.items).forEach((item) => {
      const deletedAt = deletedItems[item.id];
      if (deletedAt && newerDate(deletedAt, item.updatedAt)) return;

      const current = byId.get(item.id);
      if (!current || newerDate(item.updatedAt, current.updatedAt)) {
        byId.set(item.id, item);
      }
    });

    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      items: [...byId.values()].sort((a, b) => new Date(a.doneAt || a.createdAt) - new Date(b.doneAt || b.createdAt)),
      deletedItems,
      warnings: summarizeValidation({
        itemsOverLimit: localNormalized.summary.itemsOverLimit,
        invalidItems: localNormalized.summary.invalidItems,
        truncatedTexts: localNormalized.summary.truncatedTexts,
        deletedOverLimit: localDeletedNormalized.summary.deletedOverLimit,
        invalidDeletes: localDeletedNormalized.summary.invalidDeletes,
      }),
    };
  }

  async function sync(options = {}) {
    const silent = Boolean(options.silent);
    const interactive = options.interactive ?? !silent;

    if (syncInFlight) {
      syncQueued = true;
      return false;
    }

    syncInFlight = true;
    try {
      await ensureGoogleClients();
      if (!signedIn || !gapi.client.getToken()) {
        const connected = await signIn({ prompt: interactive && !hasConnectionHint() ? 'consent' : '', silent });
        if (!connected) return;
      }
      setStatus('syncing', I18N.getLanguage() === 'en' ? 'Syncing Drive...' : 'Drive 同期中...');

      const file = await findDriveFile();
      const remotePayload = await readRemotePayload(file?.id);
      const mergedPayload = mergePayload(hooks.getItems(), remotePayload);

      await storageReplaceAll(mergedPayload.items, { deletedItems: mergedPayload.deletedItems });
      hooks.applyItems(mergedPayload.items);
      await uploadPayload(file?.id, mergedPayload);

      setStatus('on', I18N.getLanguage() === 'en' ? 'Drive synced' : 'Drive 同期済み');
      if (!silent) {
        const message = I18N.getLanguage() === 'en' ? 'Synced with Google Drive' : 'Google Drive と同期しました';
        hooks.showToast(mergedPayload.warnings.length ? `${message}\n${mergedPayload.warnings.join('\n')}` : message);
      }
      return true;
    } catch (error) {
      console.warn('[drive-sync] sync failed:', error);
      if (!silent) {
        setStatus('error', 'Drive 同期失敗');
        alert(error.message || (I18N.getLanguage() === 'en' ? 'Failed to sync with Google Drive.' : 'Google Drive との同期に失敗しました。'));
      }
      return false;
    } finally {
      syncInFlight = false;
      if (syncQueued) {
        syncQueued = false;
        scheduleSync();
      }
    }
  }

  function scheduleSync(delay = 1200) {
    if (!signedIn || !gapi.client.getToken()) return;
    clearTimeout(syncTimer);
    syncTimer = setTimeout(() => {
      sync({ silent: true, interactive: false });
    }, delay);
  }

  window.doneStackDrive = {
    init(nextHooks) {
      hooks = { ...hooks, ...nextHooks };
      if (!getClientId()) {
        setStatus('setup', 'Drive 設定待ち');
        return;
      }
    },
    signIn,
    sync,
    scheduleSync,
  };
})();
