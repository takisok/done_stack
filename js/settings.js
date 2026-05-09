let settingsItems = [];

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3200);
}

function updateItemCount() {
  const el = document.getElementById('settingsItemCount');
  if (!el) return;
  el.textContent = I18N.t('itemUnit', { count: settingsItems.length });
}

function initUserNameSetting() {
  const input = document.getElementById('userNameInput');
  if (!input) return;
  input.value = I18N.getUserName();

  const save = () => {
    const nextName = I18N.setUserName(input.value);
    input.value = nextName;
  };

  input.addEventListener('change', save);
  input.addEventListener('blur', save);
}

function getActiveItems() {
  return [...settingsItems];
}

function applySyncedItems(nextItems) {
  settingsItems = nextItems
    .filter((item) => item && item.id && item.text && item.createdAt)
    .map((item) => ({ ...item, doneAt: item.doneAt || item.createdAt }))
    .sort((a, b) => new Date(a.doneAt || a.createdAt) - new Date(b.doneAt || b.createdAt));
  updateItemCount();
}

function escapeCsv(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function formatLocalTimestampForFile(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + '_' + [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join('-');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        value += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        value += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(value);
      value = '';
    } else if (char === '\n') {
      row.push(value);
      rows.push(row);
      row = [];
      value = '';
    } else if (char !== '\r') {
      value += char;
    }
  }

  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }

  return rows;
}

function parseDoneCsv(text) {
  const rows = parseCsv(text.replace(/^\uFEFF/, ''));
  if (!rows.length) return [];

  const header = rows[0].map((value) => value.trim());
  const idIndex = header.indexOf('id');
  const createdAtIndex = header.indexOf('createdAt');
  const doneAtIndex = header.indexOf('doneAt');
  const textIndex = header.indexOf('text');

  if (idIndex === -1 || createdAtIndex === -1 || textIndex === -1) {
    throw new Error(I18N.t('csvHeaderError'));
  }

  return rows.slice(1)
    .filter((row) => row.some((value) => String(value).trim() !== ''))
    .map((row, index) => {
      const id = String(row[idIndex] ?? '').trim();
      const createdAt = String(row[createdAtIndex] ?? '').trim();
      const doneAt = doneAtIndex === -1 ? createdAt : String(row[doneAtIndex] ?? '').trim() || createdAt;
      const doneText = String(row[textIndex] ?? '').trim();

      if (!id || !createdAt || !doneAt || !doneText) {
        throw new Error(I18N.t('csvEmptyError', { line: index + 2 }));
      }

      if (Number.isNaN(new Date(createdAt).getTime()) || Number.isNaN(new Date(doneAt).getTime())) {
        throw new Error(I18N.t('csvDateError', { line: index + 2 }));
      }

      return { id, createdAt, doneAt, text: doneText };
    });
}

function exportCsv() {
  if (settingsItems.length === 0) {
    alert(I18N.t('noData'));
    return;
  }

  const rows = [['id', 'createdAt', 'doneAt', 'text']];
  settingsItems.forEach((item) => {
    rows.push([item.id, item.createdAt, item.doneAt || item.createdAt, item.text].map(escapeCsv));
  });

  const csv = rows.map((row) => row.join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `done_stack_${formatLocalTimestampForFile(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function importCsv(file) {
  const csvText = await file.text();
  const importedItems = parseDoneCsv(csvText);
  const existingIds = new Set(settingsItems.map((item) => String(item.id)));
  const newItems = [];

  importedItems.forEach((item) => {
    const id = String(item.id);
    if (existingIds.has(id)) return;
    existingIds.add(id);
    newItems.push(item);
  });

  for (const item of newItems) {
    const importedItem = { ...item, updatedAt: item.updatedAt || item.createdAt };
    await storageSave(importedItem);
    settingsItems.push(importedItem);
  }

  settingsItems.sort((a, b) => new Date(a.doneAt || a.createdAt) - new Date(b.doneAt || b.createdAt));
  updateItemCount();
  window.doneStackDrive?.scheduleSync?.();
  showToast(I18N.t('importDone', { count: newItems.length }));
}

async function initSettings() {
  I18N.initControls();
  initUserNameSetting();
  window.addEventListener('done-stack-language-change', updateItemCount);

  settingsItems = await storageLoad();
  settingsItems = settingsItems.map((item) => ({ ...item, doneAt: item.doneAt || item.createdAt }));
  settingsItems.sort((a, b) => new Date(a.doneAt || a.createdAt) - new Date(b.doneAt || b.createdAt));
  updateItemCount();

  if (window.doneStackDrive) {
    window.doneStackDrive.init({
      getItems: getActiveItems,
      applyItems: applySyncedItems,
      showToast,
    });
  }

  document.getElementById('driveSyncBtn')?.addEventListener('click', async () => {
    await window.doneStackDrive?.sync();
  });

  document.getElementById('exportCsvBtn')?.addEventListener('click', exportCsv);
  document.getElementById('importCsvBtn')?.addEventListener('click', () => {
    document.getElementById('importCsvInput').click();
  });

  document.getElementById('importCsvInput')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      await importCsv(file);
    } catch (error) {
      console.warn('CSV import failed:', error);
      alert(error.message || I18N.t('csvImportFailed'));
    }
  });
}

initSettings().catch((error) => {
  console.error('[settings]', error);
  alert(I18N.t('csvImportFailed'));
});
