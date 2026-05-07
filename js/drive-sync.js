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
    return typeof response.body === 'string' ? JSON.parse(response.body) : response.result;
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

    const delimiter = '-------done-stack-boundary';
    const body = [
      `--${delimiter}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${delimiter}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(payload),
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
    return items
      .filter((item) => item && item.id && item.text && item.createdAt)
      .map((item) => ({
        id: String(item.id),
        text: String(item.text),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt || item.createdAt,
      }));
  }

  function newerDate(a, b) {
    return new Date(a || 0).getTime() >= new Date(b || 0).getTime();
  }

  function mergePayload(localItems, remotePayload) {
    const remoteItems = normalizeItems(remotePayload?.items || []);
    const localDeleted = storageGetSyncState().deletedItems || {};
    const remoteDeleted = remotePayload?.deletedItems || {};
    const deletedItems = { ...remoteDeleted, ...localDeleted };
    const byId = new Map();

    normalizeItems(localItems).concat(remoteItems).forEach((item) => {
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
      items: [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
      deletedItems,
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
      if (!silent) hooks.showToast(I18N.getLanguage() === 'en' ? 'Synced with Google Drive' : 'Google Drive と同期しました');
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
