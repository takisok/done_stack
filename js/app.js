/* =====================================================
   app.js — メインアプリケーションロジック
   依存: storage.js / speech.js が先に読み込まれていること
   ===================================================== */

// ── 状態 ─────────────────────────────────────────

let items       = [];   // { id, text, createdAt }[]
let currentCount = 0;
let editingItem = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 20;

// ── 効果音 ──────────────────────────────────────

let audioCtx = null;
let lastTypeSoundAt = 0;

function getAudioContext() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playNoiseBurst({ duration, gain, filterFreq, type = 'highpass' }) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const sampleCount = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i++) {
    const fade = 1 - (i / sampleCount);
    data[i] = (Math.random() * 2 - 1) * fade;
  }

  const source = ctx.createBufferSource();
  const filter = ctx.createBiquadFilter();
  const amp = ctx.createGain();

  filter.type = type;
  filter.frequency.value = filterFreq;
  amp.gain.setValueAtTime(gain, ctx.currentTime);
  amp.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  source.buffer = buffer;
  source.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  source.start();
  source.stop(ctx.currentTime + duration);
}

function playKeySound() {
  const now = performance.now();
  if (now - lastTypeSoundAt < 35) return;
  lastTypeSoundAt = now;

  playNoiseBurst({
    duration: 0.018,
    gain: 0.035,
    filterFreq: 1800 + Math.random() * 900,
  });
}

function playDoneSound() {
  playNoiseBurst({
    duration: 0.085,
    gain: 0.12,
    filterFreq: 900,
  });

  setTimeout(() => {
    playNoiseBurst({
      duration: 0.12,
      gain: 0.17,
      filterFreq: 520,
      type: 'bandpass',
    });
  }, 45);
}

// ── カウンター ────────────────────────────────────

function animateCounter(target) {
  const el = document.getElementById('counterNum');

  // バウンスアニメーション
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 400);

  // 数字のカウントアップ
  const start = currentCount;
  const dur   = 400;
  const t0    = Date.now();

  function step() {
    const progress = Math.min((Date.now() - t0) / dur, 1);
    const ease     = 1 - Math.pow(1 - progress, 3);  // ease-out cubic
    el.textContent = Math.round(start + (target - start) * ease);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      el.textContent = target;
      currentCount   = target;
    }
  }
  requestAnimationFrame(step);
}

// ── 吹き出し ──────────────────────────────────────

const bubbleTimers = new Map();
let maidTalkStopTimer = null;
let maidFrameTimer = null;
const MAID_FRAMES = {
  idle: 'img/maid/maid-idle.png',
  thinking: 'img/maid/maid-thinking.png',
  talk: ['img/maid/maid-talk-1.png', 'img/maid/maid-talk-2.png', 'img/maid/maid-talk-1.png'],
};

Object.values(MAID_FRAMES).flat().forEach((src) => {
  const img = new Image();
  img.src = src;
});

function stopMaidTalkAnimation(delay = 120) {
  const maidImage = document.getElementById('maidImage');

  if (maidFrameTimer) {
    clearInterval(maidFrameTimer);
    maidFrameTimer = null;
  }

  if (maidTalkStopTimer) clearTimeout(maidTalkStopTimer);
  maidTalkStopTimer = setTimeout(() => {
    if (maidImage) maidImage.src = MAID_FRAMES.idle;
    maidTalkStopTimer = null;
  }, delay);
}

function showMaidThinkingPose() {
  const maidImage = document.getElementById('maidImage');
  if (!maidImage) return;

  if (maidFrameTimer) {
    clearInterval(maidFrameTimer);
    maidFrameTimer = null;
  }

  if (maidTalkStopTimer) {
    clearTimeout(maidTalkStopTimer);
    maidTalkStopTimer = null;
  }

  maidImage.src = MAID_FRAMES.thinking;
}

function startMaidTalkAnimation() {
  const maidImage = document.getElementById('maidImage');
  if (!maidImage) return;

  stopMaidTalkAnimation(0);
  if (maidTalkStopTimer) {
    clearTimeout(maidTalkStopTimer);
    maidTalkStopTimer = null;
  }

  let frame = 0;
  maidImage.src = MAID_FRAMES.talk[0];
  maidFrameTimer = setInterval(() => {
    frame = (frame + 1) % MAID_FRAMES.talk.length;
    maidImage.src = MAID_FRAMES.talk[frame];
  }, 130);
}

function setBubble(id, text) {
  const el = document.getElementById(id);
  const message = String(text);

  if (bubbleTimers.has(id)) {
    clearInterval(bubbleTimers.get(id));
    bubbleTimers.delete(id);
  }

  el.classList.remove('pop');
  void el.offsetWidth;   // アニメーションをリセット
  el.classList.add('pop');

  if (id !== 'maidBubble') {
    el.textContent = message;
    return;
  }

  let index = 0;
  el.textContent = '';
  startMaidTalkAnimation();

  const speed = message.length > 70 ? 18 : 28;
  const timer = setInterval(() => {
    index += 1;
    el.textContent = message.slice(0, index);

    if (index >= message.length) {
      clearInterval(timer);
      bubbleTimers.delete(id);
      stopMaidTalkAnimation(180);
    }
  }, speed);

  bubbleTimers.set(id, timer);
}

// ── パーティクル ──────────────────────────────────

const EMOJI_PARTICLES = ['✦', '✧', '◇', '◆', '✶', '✸', '·', '•'];

function spawnParticles(x, y) {
  for (let i = 0; i < 8; i++) {
    const p = document.createElement('div');
    p.className    = 'particle';
    p.textContent  = pick(EMOJI_PARTICLES);
    p.style.left   = (x + Math.random() * 80 - 40) + 'px';
    p.style.top    = (y + Math.random() * 40 - 20) + 'px';
    p.style.animationDelay = (Math.random() * 0.3) + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1800);
  }
}

// ── マイルストーントースト ────────────────────────

const MILESTONE_MESSAGES = {
  1:    '最初の一歩。ここから始まる。',
  5:    '5達成。ペースが生まれてきた。',
  10:   '10達成。二桁の領域へ。',
  20:   '20達成。習慣になりつつある。',
  50:   '50達成。本物の積み上げだ。',
  100:  '100達成。伝説の始まり。',
  200:  '200達成。もう止まらない。',
  500:  '500達成。圧倒的な軌跡。',
  1000: '1000達成。あなたは伝説だ。',
};

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3200);
}

function applySyncedItems(nextItems) {
  items = nextItems
    .filter((item) => item && item.id && item.text && item.createdAt)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  currentPage = 1;
  currentCount = items.length;
  document.getElementById('counterNum').textContent = currentCount;
  renderList();
}

function getActiveItems() {
  return [...items];
}

function scheduleDriveSync() {
  window.doneStackDrive?.scheduleSync?.();
}

function checkMilestone(n) {
  const msg = MILESTONE_MESSAGES[n];
  if (msg) showToast(msg);
}

// ── リスト描画 ────────────────────────────────────

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('ja-JP',  { year: 'numeric', month: '2-digit', day: '2-digit' })
       + ' '
       + d.toLocaleTimeString('ja-JP',  { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        cell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      row.push(cell);
      cell = '';
      continue;
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = '';
      continue;
    }

    cell += char;
  }

  row.push(cell);
  if (row.some((value) => value.length > 0)) rows.push(row);
  return rows;
}

function normalizeCsvHeader(value) {
  return String(value ?? '').replace(/^\uFEFF/, '').trim();
}

function parseDoneCsv(text) {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];

  const headers = rows[0].map(normalizeCsvHeader);
  const idIndex = headers.indexOf('id');
  const createdAtIndex = headers.indexOf('createdAt');
  const textIndex = headers.indexOf('text');

  if (idIndex === -1 || createdAtIndex === -1 || textIndex === -1) {
    throw new Error('CSVのヘッダーは id,createdAt,text の形式にしてください。');
  }

  return rows.slice(1).map((row, index) => {
    const id = String(row[idIndex] ?? '').trim();
    const createdAt = String(row[createdAtIndex] ?? '').trim();
    const doneText = String(row[textIndex] ?? '').trim();

    if (!id || !createdAt || !doneText) {
      throw new Error(`${index + 2}行目に空の項目があります。`);
    }

    if (Number.isNaN(new Date(createdAt).getTime())) {
      throw new Error(`${index + 2}行目のcreatedAtが日時として読めません。`);
    }

    return { id, createdAt, text: doneText };
  });
}

function getPageCount() {
  return Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
}

function clampCurrentPage() {
  currentPage = Math.min(Math.max(currentPage, 1), getPageCount());
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  const pageCount = getPageCount();
  pagination.innerHTML = '';

  if (items.length <= ITEMS_PER_PAGE) {
    pagination.hidden = true;
    return;
  }

  pagination.hidden = false;

  const makeButton = (label, page, options = {}) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-btn';
    button.textContent = label;
    button.disabled = options.disabled || false;
    if (options.current) button.classList.add('current');
    button.addEventListener('click', () => {
      currentPage = page;
      renderList();
    });
    return button;
  };

  pagination.appendChild(makeButton('前へ', currentPage - 1, { disabled: currentPage === 1 }));

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = `${currentPage} / ${pageCount}`;
  pagination.appendChild(info);

  pagination.appendChild(makeButton('次へ', currentPage + 1, { disabled: currentPage === pageCount }));
}

function renderList() {
  const list    = document.getElementById('doneList');
  const countEl = document.getElementById('listCount');

  clampCurrentPage();
  renderPagination();

  if (items.length === 0) {
    countEl.textContent = '';
  } else {
    const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
    const end = Math.min(currentPage * ITEMS_PER_PAGE, items.length);
    countEl.textContent = `${start}-${end} / ${items.length}件`;
  }

  if (items.length === 0) {
    list.innerHTML = '<div class="empty-state">まだ何も積み上がっていません。<br>最初の一歩を踏み出しましょう！</div>';
    return;
  }

  // 新しい順（追加順の逆）で表示
  const sorted = [...items].reverse();
  const pageItems = sorted.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  list.innerHTML = '';

  pageItems.forEach((item, idx) => {
    const el  = document.createElement('div');
    el.className    = 'done-item';
    el.dataset.id   = item.id;
    const num = items.length - ((currentPage - 1) * ITEMS_PER_PAGE + idx);

    el.innerHTML = `
      <div class="item-num">#${num}</div>
      <div class="item-body">
        <div class="item-text">${escapeHtml(item.text)}</div>
        <div class="item-date">${formatDate(item.createdAt)}</div>
      </div>
      <div class="item-edit-hint">✎ 編集</div>`;

    el.addEventListener('click', () => openModal(item));
    list.appendChild(el);
  });
}

// ── 編集モーダル ──────────────────────────────────

function openModal(item) {
  editingItem = item;
  document.getElementById('modalDate').textContent  = formatDate(item.createdAt);
  document.getElementById('modalInput').value       = item.text;
  document.getElementById('modalBg').classList.add('open');
  document.getElementById('modalInput').focus();
}

function closeModal() {
  document.getElementById('modalBg').classList.remove('open');
  editingItem = null;
}

document.getElementById('btnCancel').addEventListener('click', closeModal);

document.getElementById('modalBg').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modalBg')) closeModal();
});

document.getElementById('btnSave').addEventListener('click', async () => {
  if (!editingItem) return;
  const newText = document.getElementById('modalInput').value.trim();
  if (!newText) { alert('テキストを入力してください'); return; }

  const updatedItem = { ...editingItem, text: newText, updatedAt: new Date().toISOString() };
  const idx = items.findIndex(i => i.id === updatedItem.id);
  if (idx > -1) items[idx] = updatedItem;

  renderList();
  closeModal();
  setBubble('maidBubble', '修正されましたね！\n完璧主義ですわ✨');

  try {
    await storageUpdate(updatedItem);
    scheduleDriveSync();
  } catch (e) { console.warn('update failed', e); }
});

document.getElementById('btnDel').addEventListener('click', async () => {
  if (!editingItem) return;
  if (!confirm('この記録を削除しますか？')) return;

  const delId = editingItem.id;
  items = items.filter(i => i.id !== delId);
  clampCurrentPage();

  animateCounter(items.length);
  renderList();
  closeModal();
  setBubble('maidBubble',  '削除しました…\nでもまた積み上げましょう！');
  setBubble('mascotBubble', '消えた。まあいいけど');

  try {
    await storageDelete(delId);
    scheduleDriveSync();
  } catch (e) { console.warn('delete failed', e); }
});

// ── Done 追加 ─────────────────────────────────────

async function addDone() {
  const input = document.getElementById('doneInput');
  const text  = input.value.trim();
  if (!text) return;
  playDoneSound();

  const now  = new Date().toISOString();
  const item = { id: storageCreateId(), text, createdAt: now, updatedAt: now };
  items.push(item);
  currentPage = 1;

  // ── UI を即時更新（DB保存を待たない） ──
  animateCounter(items.length);
  checkMilestone(items.length);
  respondWithCharacters(text);  // LLM or 静的フォールバック（非同期、非ブロッキング）
  const btn  = document.getElementById('doneBtn');
  const rect = btn.getBoundingClientRect();
  spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);

  input.value = '';
  renderList();
  setTimeout(() => {
    const first = document.querySelector('.done-item');
    if (first) first.classList.add('new-item');
  }, 50);
  input.focus();

  // ── バックグラウンドで永続化 ──
  try {
    await storageSave(item);
    scheduleDriveSync();
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

document.getElementById('doneBtn').addEventListener('click', addDone);

// ── ヘッダーメニュー ──────────────────────────────
document.getElementById('menuBtn').addEventListener('click', e => {
  e.stopPropagation();
  document.getElementById('menuDropdown').classList.toggle('open');
});
document.addEventListener('click', () => {
  document.getElementById('menuDropdown').classList.remove('open');
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
  document.getElementById('menuDropdown').classList.remove('open');
  if (items.length === 0) {
    alert('まだデータがありません。');
    return;
  }
  const escapeCsv = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const formatLocalTimestampForFile = (date) => {
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
  };
  const rows = [['id', 'createdAt', 'text']];
  items.forEach((item) => {
    rows.push([item.id, item.createdAt, item.text].map(escapeCsv));
  });
  const csv  = rows.map(r => r.join(',')).join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `done_stack_${formatLocalTimestampForFile(new Date())}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById('importCsvBtn').addEventListener('click', () => {
  document.getElementById('menuDropdown').classList.remove('open');
  document.getElementById('importCsvInput').click();
});

document.getElementById('importCsvInput').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file) return;

  try {
    const csvText = await file.text();
    const importedItems = parseDoneCsv(csvText);
    const existingIds = new Set(items.map((item) => String(item.id)));
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
      items.push(importedItem);
    }
    scheduleDriveSync();

    items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    currentPage = 1;
    animateCounter(items.length);
    renderList();

    showToast(`${newItems.length}件を取り込みました`);
    if (newItems.length > 0) {
      setBubble('maidBubble', `${newItems.length}件の記録を取り込みました。\n履歴が少し厚くなりましたね。`);
    }
  } catch (error) {
    console.warn('CSV import failed:', error);
    alert(error.message || 'CSVの読み込みに失敗しました。');
  }
});

const driveSyncBtn = document.getElementById('driveSyncBtn');

if (driveSyncBtn && window.doneStackDrive) {
  window.doneStackDrive.init({
    getItems: getActiveItems,
    applyItems: applySyncedItems,
    statusEl: document.getElementById('driveStatus'),
    showToast,
  });

  driveSyncBtn.addEventListener('click', async () => {
    document.getElementById('menuDropdown').classList.remove('open');
    await window.doneStackDrive.sync();
  });
}

const doneInput = document.getElementById('doneInput');

doneInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    addDone();
    return;
  }

  if (e.isComposing || e.key === 'Process') return;

  if (e.key.length === 1 || e.key === 'Backspace' || e.key === 'Delete') {
    playKeySound();
  }
});

doneInput.addEventListener('compositionupdate', playKeySound);

doneInput.addEventListener('beforeinput', (e) => {
  if (e.inputType === 'insertCompositionText' || e.inputType === 'deleteCompositionText') {
    playKeySound();
  }
});

// ── LLM キャラクター応答 ──────────────────────────

/**
 * メイド吹き出しをストリーミング受信モードで開く。
 * 既存のタイプライターをキャンセルし、アニメーションを起動する。
 * 返り値の append/finish で外部から内容を注入できる。
 */
function openMaidStream() {
  const el = document.getElementById('maidBubble');

  if (bubbleTimers.has('maidBubble')) {
    clearInterval(bubbleTimers.get('maidBubble'));
    bubbleTimers.delete('maidBubble');
  }

  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop', 'thinking');
  el.innerHTML = '<span class="bubble-spinner"></span>';
  showMaidThinkingPose();

  let started = false;
  return {
    append(chunk) {
      if (!started) {
        started = true;
        el.classList.remove('thinking');
        el.textContent = '';
        startMaidTalkAnimation();
      }
      el.textContent += chunk;
    },
    finish() {
      el.classList.remove('thinking');
      stopMaidTalkAnimation(180);
    },
  };
}

/**
 * LLMでキャラクター応答を生成し、失敗時は静的セリフにフォールバックする。
 * addDone から非同期で呼ぶ（await しない）。
 */
async function respondWithCharacters(doneText) {
  if (llmAvailable) {
    // ── メイド: ストリーミング ──
    const stream = openMaidStream();
    try {
      await getMaidLLMResponse(doneText, chunk => stream.append(chunk));
      stream.finish();
    } catch (e) {
      stream.finish();
      setBubble('maidBubble', getMaidSpeech(doneText));
    }

    // ── マスコット: 一括取得（少し遅らせて） ──
    if (Math.random() < 0.6) {
      setTimeout(async () => {
        try {
          const speech = await getMascotLLMResponse(doneText);
          setBubble('mascotBubble', speech || getMascotSpeech());
        } catch {
          setBubble('mascotBubble', getMascotSpeech());
        }
      }, 600);
    }
  } else {
    // LLM 未接続 → 静的セリフ
    setBubble('maidBubble', getMaidSpeech(doneText));
    if (Math.random() < 0.6) {
      setTimeout(() => setBubble('mascotBubble', getMascotSpeech()), 600);
    }
  }
}

// ── 初期化 ───────────────────────────────────────

async function init() {
  checkLLMAvailable();  // バックグラウンドで確認（結果を待たずに続行）

  items = await storageLoad();
  items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  currentCount = items.length;
  document.getElementById('counterNum').textContent = currentCount;
  renderList();

  // ウェルカムセリフ
  if (items.length === 0) {
    setBubble('maidBubble',   '初めまして！\n一緒に積み上げましょう！');
    setBubble('mascotBubble', '…よろしく（ぶっきらぼう）');
  } else {
    const n = items.length;
    setBubble('maidBubble',   `おかえりなさい！\nもう${n}個も積み上げましたね✨`);
    setBubble('mascotBubble', n >= 10 ? 'また来たの。まあいいけど' : '続けてるね、ちょっとだけ感心');
  }
}

init().catch(e => {
  console.error('[init]', e);
  document.getElementById('maidBubble').textContent = 'データの読み込みに失敗しました…';
});
