/* =====================================================
   app.js — メインアプリケーションロジック
   依存: storage.js / speech.js が先に読み込まれていること
   ===================================================== */

// ── 状態 ─────────────────────────────────────────

let items       = [];   // { id, text, createdAt, doneAt }[]
let currentCount = 0;
let editingItem = null;
let currentPage = 1;
const ITEMS_PER_PAGE = 20;
const DONE_PLACEHOLDERS = {
  ja: [
    '何かしようと思った',
    'ゴミを捨てた',
    '体重を測った',
    '教科書を開いた',
    '机の上を片付けた',
    '水を一杯飲んだ',
    'メールを返した',
    '靴をそろえた',
    '5秒だけ作業した',
    'カレンダーに予定を入れた',
    '洗濯物をかごに入れた',
    '本を1ページ読んだ',
    'スマホを置いた',
    '今日が何日か確認した',
    'やる気を探した',
    'やる気がないことに気づいた',
    '洗濯物の存在を認めた',
    '深呼吸した',
    '今日も人間をやっている',
  ],
  en: [
    'thought about doing something',
    'took out the trash',
    'checked my weight',
    'opened a textbook',
    'cleared a tiny bit of my desk',
    'drank a glass of water',
    'replied to one message',
    'lined up my shoes',
    'worked for 5 seconds',
    'put a plan on the calendar',
    'put laundry in the basket',
    'read one page',
    'put down my phone',
    'checked what day it is',
    'looked for motivation',
    'noticed I had no motivation',
    'acknowledged the laundry exists',
    'took a deep breath',
    'continued being human today',
  ],
};

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
const LIGHT_PARTICLE_COLORS = [
  '#ff5f8f',
  '#ffb84d',
  '#fff06a',
  '#58e6a7',
  '#4dd8ff',
  '#7f8cff',
  '#d86bff',
];
function spawnParticles(x, y) {
  const ring = document.createElement('div');
  ring.className = 'particle-ring';
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  document.body.appendChild(ring);
  setTimeout(() => ring.remove(), 900);

  for (let i = 0; i < 22; i++) {
    const angle = (Math.PI * 2 * i) / 22 + (Math.random() * 0.55 - 0.275);
    const distance = 28 + Math.random() * 58;
    const color = pick(LIGHT_PARTICLE_COLORS);
    const p = document.createElement('div');
    p.className = 'light-particle';
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    p.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * distance - 16}px`);
    p.style.setProperty('--particle-color', color);
    p.style.animationDelay = `${Math.random() * 0.08}s`;
    p.style.animationDuration = `${1.45 + Math.random() * 0.55}s`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 2300);
  }

  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div');
    p.className    = 'particle';
    p.textContent  = pick(EMOJI_PARTICLES);
    p.style.setProperty('--particle-color', pick(LIGHT_PARTICLE_COLORS));
    p.style.left   = (x + Math.random() * 80 - 40) + 'px';
    p.style.top    = (y + Math.random() * 40 - 20) + 'px';
    p.style.animationDelay = (Math.random() * 0.3) + 's';
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 1800);
  }
}

function spawnFireworkBurst(x, y, size = 1) {
  const count = size >= 1.1 ? 64 : 48;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() * 0.48 - 0.24);
    const distance = (86 + Math.random() * 168) * size;
    const particle = document.createElement('div');
    const isShape = Math.random() < 0.42;
    particle.className = isShape ? 'particle firework-shape-particle' : 'light-particle firework-light-particle';
    if (isShape) particle.textContent = pick(EMOJI_PARTICLES);
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--dy', `${Math.sin(angle) * distance - 18}px`);
    particle.style.setProperty('--particle-color', pick(LIGHT_PARTICLE_COLORS));
    if (isShape) particle.style.setProperty('--start-rotate', `${Math.random() * 120 - 60}deg`);
    particle.style.animationDelay = `${Math.random() * 0.08}s`;
    particle.style.animationDuration = `${1.05 + Math.random() * 0.45}s`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 1800);
  }
}

function spawnCelebrationFireworks(count) {
  if (count < 10 || count % 10 !== 0) return;

  const isHundred = count % 100 === 0;
  const burstCount = isHundred ? 6 : 3;
  const topLimit = Math.max(160, window.innerHeight * 0.58);

  for (let i = 0; i < burstCount; i++) {
    const delay = i * (isHundred ? 190 : 230) + Math.random() * 120;
    setTimeout(() => {
      const x = window.innerWidth * (0.14 + Math.random() * 0.72);
      const y = 72 + Math.random() * (topLimit - 72);
      spawnFireworkBurst(x, y, isHundred ? 1.18 : 0.92);
    }, delay);
  }
}

// ── マイルストーントースト ────────────────────────

const MILESTONE_KEYS = new Set([1, 5, 10, 20, 50, 100, 200, 500, 1000]);

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3200);
}

function applySyncedItems(nextItems) {
  items = nextItems
    .filter((item) => item && item.id && item.text && item.createdAt)
    .map((item) => ({ ...item, doneAt: item.doneAt || item.createdAt }))
    .sort((a, b) => new Date(getItemDoneAt(a)) - new Date(getItemDoneAt(b)));
  currentPage = 1;
  currentCount = items.length;
  document.getElementById('counterNum').textContent = currentCount;
  renderList();
}

function getActiveItems() {
  return [...items];
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function scheduleDriveSync() {
  window.doneStackDrive?.scheduleSync?.();
}

function setRandomDonePlaceholder() {
  const input = document.getElementById('doneInput');
  if (!input) return;
  const lang = window.I18N?.getLanguage?.() || 'ja';
  const pool = DONE_PLACEHOLDERS[lang] || DONE_PLACEHOLDERS.ja;
  const count = 2 + Math.floor(Math.random() * 2);
  const examples = [...pool]
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
  input.placeholder = lang === 'en'
    ? `e.g. ${examples.join(', ')}`
    : `例：${examples.join('、')}`;
}

function checkMilestone(n) {
  if (MILESTONE_KEYS.has(n)) showToast(I18N.t(`milestone_${n}`));
}

// ── リスト描画 ────────────────────────────────────

function formatDate(iso) {
  const d = new Date(iso);
  const locale = I18N.getLanguage() === 'en' ? 'en-US' : 'ja-JP';
  return d.toLocaleDateString(locale,  { year: 'numeric', month: '2-digit', day: '2-digit' })
       + ' '
       + d.toLocaleTimeString(locale,  { hour: '2-digit', minute: '2-digit' });
}

function getItemDoneAt(item) {
  return item.doneAt || item.createdAt;
}

function toDateTimeLocalValue(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function fromDateTimeLocalValue(value, fallbackIso) {
  if (!value) return fallbackIso;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallbackIso : date.toISOString();
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
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

  pagination.appendChild(makeButton(I18N.t('prev'), currentPage - 1, { disabled: currentPage === 1 }));

  const info = document.createElement('span');
  info.className = 'page-info';
  info.textContent = I18N.t('pageInfo', { current: currentPage, total: pageCount });
  pagination.appendChild(info);

  pagination.appendChild(makeButton(I18N.t('next'), currentPage + 1, { disabled: currentPage === pageCount }));
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
    countEl.textContent = I18N.getLanguage() === 'en'
      ? `${start}-${end} / ${items.length}`
      : `${start}-${end} / ${items.length}件`;
  }

  if (items.length === 0) {
    list.innerHTML = `<div class="empty-state">${I18N.t('emptyList')}</div>`;
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
        <div class="item-date">${formatDate(getItemDoneAt(item))}</div>
      </div>
      <div class="item-edit-hint">${I18N.t('editHint')}</div>`;

    el.addEventListener('click', () => openModal(item));
    list.appendChild(el);
  });
}

// ── 編集モーダル ──────────────────────────────────

function openModal(item) {
  editingItem = item;
  document.getElementById('modalDate').textContent  = `${I18N.t('createdAt')}: ${formatDate(item.createdAt)}`;
  document.getElementById('modalDoneAt').value      = toDateTimeLocalValue(getItemDoneAt(item));
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
  if (!newText) { alert(I18N.t('textRequired')); return; }

  const nextDoneAt = fromDateTimeLocalValue(document.getElementById('modalDoneAt').value, getItemDoneAt(editingItem));
  const updatedItem = { ...editingItem, text: newText, doneAt: nextDoneAt, updatedAt: new Date().toISOString() };
  const idx = items.findIndex(i => i.id === updatedItem.id);
  if (idx > -1) items[idx] = updatedItem;
  items.sort((a, b) => new Date(getItemDoneAt(a)) - new Date(getItemDoneAt(b)));
  clampCurrentPage();

  renderList();
  closeModal();
  setBubble('maidBubble', I18N.getLanguage() === 'en'
    ? 'Edited beautifully!\nA touch of perfectionism suits you ✨'
    : '修正されましたね！\n完璧主義ですわ✨');

  try {
    await storageUpdate(updatedItem);
    scheduleDriveSync();
  } catch (e) { console.warn('update failed', e); }
});

document.getElementById('btnDel').addEventListener('click', async () => {
  if (!editingItem) return;
  if (!confirm(I18N.t('confirmDelete'))) return;

  const delId = editingItem.id;
  items = items.filter(i => i.id !== delId);
  clampCurrentPage();

  animateCounter(items.length);
  renderList();
  closeModal();
  setBubble('maidBubble', I18N.getLanguage() === 'en'
    ? 'Deleted.\nLet us stack something new again!'
    : '削除しました…\nでもまた積み上げましょう！');
  setBubble('mascotBubble', I18N.getLanguage() === 'en'
    ? 'Gone. Well, days do that.'
    : '消えた。まあ、そういう日もある。');

  try {
    await storageDelete(delId);
    scheduleDriveSync();
  } catch (e) { console.warn('delete failed', e); }
});

// ── Done 追加 ─────────────────────────────────────

async function addDone() {
  const input = document.getElementById('doneInput');
  const text  = input.value.trim() || I18N.t('blankDone');
  playDoneSound();

  const now  = new Date().toISOString();
  const item = { id: storageCreateId(), text, createdAt: now, doneAt: now, updatedAt: now };
  items.push(item);
  currentPage = 1;

  // ── UI を即時更新（DB保存を待たない） ──
  animateCounter(items.length);
  checkMilestone(items.length);
  spawnCelebrationFireworks(items.length);
  respondWithCharacters(text);  // LLM or 静的フォールバック（非同期、非ブロッキング）
  const btn  = document.getElementById('doneBtn');
  const rect = btn.getBoundingClientRect();
  spawnParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);

  input.value = '';
  setRandomDonePlaceholder();
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

if (window.doneStackDrive) {
  window.doneStackDrive.init({
    getItems: getActiveItems,
    applyItems: applySyncedItems,
    showToast,
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
  I18N.initControls();
  window.addEventListener('done-stack-language-change', () => {
    const llmState = document.getElementById('llmStatus')?.dataset.state;
    if (llmState && typeof setLLMStatus === 'function') setLLMStatus(llmState);
    setRandomDonePlaceholder();
    renderList();
  });

  checkLLMAvailable();  // バックグラウンドで確認（結果を待たずに続行）
  setRandomDonePlaceholder();

  items = await storageLoad();
  items.sort((a, b) => new Date(getItemDoneAt(a)) - new Date(getItemDoneAt(b)));

  currentCount = items.length;
  document.getElementById('counterNum').textContent = currentCount;
  renderList();

  // ウェルカムセリフ
  if (items.length === 0) {
    setBubble('maidBubble', I18N.getLanguage() === 'en'
      ? 'Nice to meet you!\nLet us start stacking together!'
      : '初めまして！\n一緒に積み上げましょう！');
    setBubble('mascotBubble', I18N.getLanguage() === 'en'
      ? '...Keytan. Fine, hello.'
      : '…キーたん。まあ、よろしく。');
  } else {
    const n = items.length;
    setBubble('maidBubble', I18N.getLanguage() === 'en'
      ? `Welcome back!\nYou have already stacked ${n} Done entries ✨`
      : `おかえりなさい！\nもう${n}個も積み上げましたね✨`);
    setBubble('mascotBubble', I18N.getLanguage() === 'en'
      ? (n >= 10 ? 'Back again. Fine, I am watching.' : 'Still continuing. Mildly impressive.')
      : (n >= 10 ? 'また来たの。まあ、見てるけど。' : '続けてるね。ちょっとだけ感心。'));
  }
}

init().catch(e => {
  console.error('[init]', e);
  document.getElementById('maidBubble').textContent = I18N.getLanguage() === 'en'
    ? 'Failed to load data...'
    : 'データの読み込みに失敗しました…';
});
