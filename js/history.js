let historyItems = [];
let currentMonth = startOfMonth(new Date());
let selectedDateKey = '';

const CATEGORY_RULES = [
  { name: '開発', words: ['実装', '修正', 'コード', 'バグ', 'テスト', 'デプロイ', 'API', 'CSS', 'HTML', 'JS', 'JavaScript', 'Python', 'React'] },
  { name: 'デザイン', words: ['デザイン', '画像', 'UI', 'CSS', 'レイアウト', '色', 'キャラ', 'イラスト', 'アニメーション', '口パク'] },
  { name: '調査', words: ['調査', '確認', '調べ', '検証', '比較', 'レビュー', '分析'] },
  { name: '文章', words: ['文章', '記事', 'メモ', '資料', 'ブログ', 'README', 'メール', '書いた'] },
  { name: '学習', words: ['学習', '勉強', '読書', '講座', '練習', '復習'] },
  { name: '健康', words: ['運動', '散歩', '筋トレ', 'ランニング', '睡眠', '病院', 'ストレッチ'] },
  { name: '家事', words: ['掃除', '洗濯', '料理', '片付け', '買い物', 'ゴミ'] },
  { name: '連絡', words: ['連絡', '会議', '返信', '相談', '打ち合わせ', '電話'] },
];

const STOP_WORDS = new Set([
  'こと', 'ため', 'よう', 'これ', 'それ', 'さん', 'した', 'して', 'でき', 'ある', 'いる',
  'する', 'なる', 'ない', 'ます', 'です', 'から', 'まで', 'など', 'として', 'について',
  'the', 'and', 'for', 'with', 'done', 'this', 'that',
]);

const wordSegmenter = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter('ja-JP', { granularity: 'word' })
  : null;

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function toMonthKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function parseItemDate(item) {
  const date = new Date(item.createdAt);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function formatMonth(date) {
  return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
}

function formatDay(date) {
  return date.toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });
}

function formatTime(date) {
  return date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getCategory(text) {
  const source = String(text);
  const match = CATEGORY_RULES.find((category) =>
    category.words.some((word) => source.toLowerCase().includes(word.toLowerCase())),
  );
  return match ? match.name : 'その他';
}

function getMonthItems() {
  const key = toMonthKey(currentMonth);
  return historyItems.filter((item) => toMonthKey(parseItemDate(item)) === key);
}

function groupByDate(items) {
  return items.reduce((acc, item) => {
    const key = toDateKey(parseItemDate(item));
    if (!acc.has(key)) acc.set(key, []);
    acc.get(key).push(item);
    return acc;
  }, new Map());
}

function summarizeDay(items) {
  if (!items.length) return 'この日の記録はまだありません。';
  const counts = countCategories(items);
  const top = counts[0]?.name ?? '活動';
  if (items.length === 1) return `${top}の記録が1件あります。`;
  return `${top}を中心に、${items.length}件の活動が積み上がっています。`;
}

function countCategories(items) {
  const counts = new Map();
  items.forEach((item) => {
    const category = getCategory(item.text);
    counts.set(category, (counts.get(category) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ja'));
}

function extractKeywords(items) {
  const counts = new Map();
  items.forEach((item) => {
    tokenizeWords(item.text).forEach((word) => {
      counts.set(word, (counts.get(word) || 0) + 1);
    });
  });
  return [...counts.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word, 'ja'))
    .slice(0, 12);
}

function tokenizeWords(text) {
  const source = String(text);
  const segments = wordSegmenter
    ? [...wordSegmenter.segment(source)].filter((segment) => segment.isWordLike).map((segment) => segment.segment)
    : source.match(/[一-龥ぁ-んァ-ヶーA-Za-z0-9]+/g) || [];

  return segments
    .map((word) => word.trim())
    .filter(Boolean)
    .map((word) => word.replace(/^[\s、。,.!?！？「」『』（）()[\]【】]+|[\s、。,.!?！？「」『』（）()[\]【】]+$/g, ''))
    .filter(Boolean)
    .map((word) => (/^[A-Za-z0-9]+$/.test(word) ? word.toLowerCase() : word))
    .filter((word) => {
      const normalized = word.toLowerCase();
      if (STOP_WORDS.has(normalized)) return false;
      if (/^\d+$/.test(word)) return false;
      if (/^[ぁ-んー]{1}$/.test(word)) return false;
      if (/^[A-Za-z0-9]$/.test(word)) return false;
      return word.length <= 18;
    });
}

function renderSummary(monthItems, grouped) {
  const total = monthItems.length;
  const activeDays = grouped.size;
  const best = [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)[0];
  const categories = countCategories(monthItems);

  document.getElementById('historyMonthTitle').textContent = formatMonth(currentMonth);
  document.getElementById('monthTotal').textContent = total;
  document.getElementById('activeDays').textContent = `${activeDays}日`;
  document.getElementById('bestDay').textContent = best ? `${Number(best[0].slice(-2))}日 (${best[1].length})` : '-';
  document.getElementById('topCategory').textContent = categories[0] ? categories[0].name : '-';

  const monthlyScopeLabel = document.getElementById('monthlyScopeLabel');
  if (monthlyScopeLabel) monthlyScopeLabel.textContent = `${formatMonth(currentMonth)}の集計`;
}

function renderContributionGraph() {
  const graph = document.getElementById('contributionGraph');
  const months = document.getElementById('contributionMonths');
  if (!graph) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  const start = new Date(end);
  start.setDate(end.getDate() - 364);
  start.setDate(start.getDate() - start.getDay());

  const counts = new Map();
  historyItems.forEach((item) => {
    const date = parseItemDate(item);
    date.setHours(0, 0, 0, 0);
    if (date < start || date > end) return;
    const key = toDateKey(date);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const maxCount = Math.max(1, ...counts.values());
  graph.innerHTML = '';
  if (months) months.innerHTML = '';

  const cursor = new Date(start);
  let column = 1;
  let lastMonth = -1;
  const currentMonthKey = toMonthKey(currentMonth);
  while (cursor <= end) {
    const key = toDateKey(cursor);
    const count = counts.get(key) || 0;
    const cellMonthKey = toMonthKey(cursor);
    const level = count === 0 ? 0 : Math.max(1, Math.ceil((count / maxCount) * 4));
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'contribution-cell';
    cell.dataset.level = level;
    cell.dataset.date = key;
    if (cellMonthKey === currentMonthKey) cell.classList.add('in-month');
    if (key === selectedDateKey) cell.classList.add('selected');
    cell.title = `${key}: ${count} Done`;
    cell.setAttribute('aria-label', `${key}: ${count} Done`);
    cell.addEventListener('click', () => {
      currentMonth = startOfMonth(new Date(`${key}T00:00:00`));
      selectedDateKey = key;
      render();
    });
    graph.appendChild(cell);

    if (months && cursor.getDate() <= 7 && cursor.getMonth() !== lastMonth) {
      const label = document.createElement('span');
      label.textContent = cursor.toLocaleDateString('ja-JP', { month: 'short' });
      label.style.gridColumn = String(column);
      months.appendChild(label);
      lastMonth = cursor.getMonth();
    }

    cursor.setDate(cursor.getDate() + 1);
    if (cursor.getDay() === 0) column += 1;
  }

  const range = document.getElementById('contributionRange');
  if (range) range.textContent = 'クリックした日を含む月へ移動';
}

function renderMonthRecords(monthItems) {
  const list = document.getElementById('monthRecordList');
  const count = document.getElementById('monthRecordCount');
  const summary = document.getElementById('monthRecordSummary');

  count.textContent = `${monthItems.length} Done`;
  summary.textContent = monthItems.length
    ? `${formatMonth(currentMonth)}の記録を日付ごとに並べています。`
    : 'この月の記録はまだありません。';

  if (!monthItems.length) {
    list.innerHTML = '<div class="history-empty">この月のDoneはありません。</div>';
    return;
  }

  const grouped = groupByDate(monthItems);
  const dateKeys = [...grouped.keys()].sort().reverse();

  list.innerHTML = dateKeys.map((dateKey) => {
    const date = new Date(`${dateKey}T00:00:00`);
    const entries = grouped.get(dateKey)
      .slice()
      .sort((a, b) => parseItemDate(a) - parseItemDate(b))
      .map((item) => {
        const category = getCategory(item.text);
        return `
          <article class="month-record-entry">
            <div class="day-entry-meta">
              <time>${formatTime(parseItemDate(item))}</time>
              <span>${escapeHtml(category)}</span>
            </div>
            <p>${escapeHtml(item.text)}</p>
          </article>
        `;
      }).join('');

    return `
      <section class="month-record-day">
        <h3>${formatDay(date)}</h3>
        ${entries}
      </section>
    `;
  }).join('');
}

function renderCategories(monthItems) {
  const categories = countCategories(monthItems);
  const total = Math.max(1, monthItems.length);
  document.getElementById('categoryTotal').textContent = `${monthItems.length}件`;

  if (!categories.length) {
    document.getElementById('categoryList').innerHTML = '<div class="history-empty">カテゴリはまだありません。</div>';
    return;
  }

  document.getElementById('categoryList').innerHTML = categories.map((category) => {
    const width = Math.max(6, Math.round((category.count / total) * 100));
    return `
      <div class="category-row">
        <div class="category-row-top">
          <span>${escapeHtml(category.name)}</span>
          <strong>${category.count}</strong>
        </div>
        <div class="category-bar"><span style="width:${width}%"></span></div>
      </div>
    `;
  }).join('');
}

function renderKeywords(monthItems) {
  const keywords = extractKeywords(monthItems);
  if (!keywords.length) {
    document.getElementById('keywordList').innerHTML = '<div class="history-empty">言葉が集まると表示されます。</div>';
    return;
  }
  document.getElementById('keywordList').innerHTML = keywords.map((keyword) =>
    `<span class="keyword-chip">${escapeHtml(keyword.word)} <strong>${keyword.count}</strong></span>`,
  ).join('');
}

function renderHighlights(monthItems) {
  const sorted = [...monthItems]
    .sort((a, b) => String(b.text).length - String(a.text).length || parseItemDate(b) - parseItemDate(a))
    .slice(0, 5);
  document.getElementById('highlightCount').textContent = `${sorted.length}件`;

  if (!sorted.length) {
    document.getElementById('highlightList').innerHTML = '<div class="history-empty">今月の記録はまだありません。</div>';
    return;
  }

  document.getElementById('highlightList').innerHTML = sorted.map((item) => {
    const date = parseItemDate(item);
    return `
      <article class="highlight-entry">
        <time>${formatDay(date)}</time>
        <p>${escapeHtml(item.text)}</p>
      </article>
    `;
  }).join('');
}

function ensureSelectedDate(grouped) {
  if (selectedDateKey && selectedDateKey.startsWith(toMonthKey(currentMonth))) return;
  const latest = [...grouped.keys()].sort().at(-1);
  selectedDateKey = latest || toDateKey(currentMonth);
}

function render() {
  const monthItems = getMonthItems();
  const grouped = groupByDate(monthItems);
  ensureSelectedDate(grouped);
  renderSummary(monthItems, grouped);
  renderMonthRecords(monthItems);
  renderCategories(monthItems);
  renderKeywords(monthItems);
  renderHighlights(monthItems);
  renderContributionGraph();
}

function moveMonth(delta) {
  currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
  selectedDateKey = '';
  render();
}

async function initHistory() {
  historyItems = await storageLoad();
  historyItems.sort((a, b) => parseItemDate(a) - parseItemDate(b));
  const latest = historyItems.at(-1);
  currentMonth = latest ? startOfMonth(parseItemDate(latest)) : startOfMonth(new Date());

  document.getElementById('prevMonthBtn').addEventListener('click', () => moveMonth(-1));
  document.getElementById('nextMonthBtn').addEventListener('click', () => moveMonth(1));
  document.getElementById('todayMonthBtn').addEventListener('click', () => {
    currentMonth = startOfMonth(new Date());
    selectedDateKey = toDateKey(new Date());
    render();
  });

  render();
}

initHistory().catch((error) => {
  console.error('[history]', error);
  document.getElementById('monthRecordList').innerHTML = '<div class="history-empty">履歴の読み込みに失敗しました。</div>';
});
