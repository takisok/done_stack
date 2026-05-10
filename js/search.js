let searchItems = [];

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function parseItemDate(item) {
  const date = new Date(item.doneAt || item.createdAt);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toDateKey(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function dateKeyToDate(dateKey) {
  return new Date(`${dateKey}T00:00:00`);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDay(date) {
  return date.toLocaleDateString(I18N.getLanguage() === 'en' ? 'en-US' : 'ja-JP', { year: 'numeric', month: 'short', day: 'numeric', weekday: 'short' });
}

function formatTime(date) {
  return date.toLocaleTimeString(I18N.getLanguage() === 'en' ? 'en-US' : 'ja-JP', { hour: '2-digit', minute: '2-digit' });
}

function countOccurrences(text, query) {
  if (!query) return 0;
  const source = String(text);
  const flags = /[A-Za-z]/.test(query) ? 'gi' : 'g';
  const matches = source.match(new RegExp(escapeRegExp(query), flags));
  return matches ? matches.length : 0;
}

function extractNumbers(text) {
  const matches = String(text).match(/[-+]?\d+(?:\.\d+)?/g) || [];
  return matches.map(Number).filter(Number.isFinite);
}

function highlightQuery(text, query) {
  const escaped = escapeHtml(text);
  if (!query) return escaped;
  const flags = /[A-Za-z]/.test(query) ? 'gi' : 'g';
  return escaped.replace(new RegExp(escapeRegExp(escapeHtml(query)), flags), '<mark>$&</mark>');
}

function groupByDate(results, valueGetter) {
  const grouped = new Map();
  results.forEach((result) => {
    const key = toDateKey(parseItemDate(result.item));
    grouped.set(key, (grouped.get(key) || 0) + valueGetter(result));
  });

  const sortedKeys = [...grouped.keys()].sort();
  if (!sortedKeys.length) return [];

  const rows = [];
  let cursor = dateKeyToDate(sortedKeys[0]);
  const endKey = sortedKeys.at(-1);

  while (toDateKey(cursor) <= endKey) {
    const dateKey = toDateKey(cursor);
    rows.push({ dateKey, value: grouped.get(dateKey) || 0 });
    cursor = addDays(cursor, 1);
  }

  return rows;
}

function renderFallbackChart(container, rows, options = {}) {
  if (!rows.length) {
    container.innerHTML = `<div class="history-empty">${I18N.t('noChartData')}</div>`;
    return;
  }

  const max = Math.max(1, ...rows.map((row) => Math.abs(row.value)));
  container.innerHTML = rows.map((row) => {
    const date = dateKeyToDate(row.dateKey);
    const width = Math.max(3, Math.round((Math.abs(row.value) / max) * 100));
    const value = options.formatValue ? options.formatValue(row.value) : row.value;
    return `
      <div class="search-bar-row">
        <time>${formatDay(date)}</time>
        <div class="search-bar-track">
          <span style="width:${width}%"></span>
        </div>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }).join('');
}

function renderLineChart(container, rows, options = {}) {
  if (!rows.length) {
    container.innerHTML = `<div class="history-empty">${I18N.t('noChartData')}</div>`;
    return;
  }

  if (!window.echarts) {
    renderFallbackChart(container, rows, options);
    return;
  }

  container.innerHTML = '';
  const chart = echarts.init(container, null, { renderer: 'canvas' });
  const labels = rows.map((row) => row.dateKey);
  const values = rows.map((row) => row.value);

  chart.setOption({
    color: [options.color || '#2f2f2f'],
    grid: { left: 42, right: 18, top: 22, bottom: 38 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(31,31,31,0.92)',
      borderWidth: 0,
      textStyle: { color: '#fff', fontSize: 12 },
      valueFormatter: (value) => options.formatValue ? options.formatValue(value) : value,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: labels,
      axisLine: { lineStyle: { color: 'rgba(0,0,0,0.22)' } },
      axisTick: { show: false },
      axisLabel: {
        color: 'rgba(0,0,0,0.52)',
        fontSize: 11,
        formatter: (value) => value.slice(5).replace('-', '/'),
      },
    },
    yAxis: {
      type: 'value',
      minInterval: options.integerOnly ? 1 : 0,
      splitLine: { lineStyle: { color: 'rgba(0,0,0,0.08)' } },
      axisLabel: { color: 'rgba(0,0,0,0.52)', fontSize: 11 },
    },
    series: [{
      name: options.name || '値',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 7,
      lineStyle: { width: 3 },
      itemStyle: { borderColor: '#ffffff', borderWidth: 2 },
      areaStyle: { opacity: 0.08 },
      data: values,
    }],
  });

  const resize = () => chart.resize();
  window.addEventListener('resize', resize, { passive: true });
}

function renderResults(results, query) {
  const list = document.getElementById('resultList');
  document.getElementById('resultCount').textContent = I18N.t('itemUnit', { count: results.length });

  if (!results.length) {
    list.innerHTML = `<div class="history-empty">${I18N.t('noResults')}</div>`;
    return;
  }

  list.innerHTML = results.map((result) => {
    const date = parseItemDate(result.item);
    const numbers = result.numbers.length
      ? `<span>${escapeHtml(I18N.t('numberLabel', { numbers: result.numbers.join(', ') }))}</span>`
      : '';
    return `
      <article class="search-result-entry">
        <div class="day-entry-meta">
          <time>${formatDay(date)} ${formatTime(date)}</time>
          <span>${escapeHtml(I18N.t('occurrenceUnit', { count: result.occurrences }))}</span>
          ${numbers}
        </div>
        <p>${highlightQuery(result.item.text, query)}</p>
      </article>
    `;
  }).join('');
}

function renderSearch(query) {
  const normalizedQuery = query.trim();
  const title = document.getElementById('searchTitle');
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = normalizedQuery;

  if (!normalizedQuery) {
    title.textContent = I18N.t('search');
    document.getElementById('matchTotal').textContent = '0';
    document.getElementById('occurrenceTotal').textContent = I18N.t('occurrenceUnit', { count: 0 });
    document.getElementById('matchDays').textContent = I18N.t('dayUnit', { count: 0 });
    document.getElementById('numberTotal').textContent = '-';
    document.getElementById('occurrenceChart').innerHTML = `<div class="history-empty">${I18N.t('enterSearchTerm')}</div>`;
    document.getElementById('numberPanel').hidden = true;
    renderResults([], normalizedQuery);
    return;
  }

  title.textContent = I18N.t('searchTitle', { query: normalizedQuery });
  const results = searchItems
    .map((item) => ({
      item,
      occurrences: countOccurrences(item.text, normalizedQuery),
      numbers: extractNumbers(item.text),
    }))
    .filter((result) => result.occurrences > 0)
    .sort((a, b) => parseItemDate(b.item) - parseItemDate(a.item));

  const occurrenceTotal = results.reduce((sum, result) => sum + result.occurrences, 0);
  const occurrenceRows = groupByDate(results, (result) => result.occurrences);
  const numberRows = groupByDate(results, (result) => result.numbers.reduce((sum, value) => sum + value, 0));
  const activeDayCount = new Set(results.map((result) => toDateKey(parseItemDate(result.item)))).size;
  const numberTotal = results.reduce((sum, result) => sum + result.numbers.reduce((inner, value) => inner + value, 0), 0);
  const numberCount = results.reduce((sum, result) => sum + result.numbers.length, 0);

  document.getElementById('matchTotal').textContent = results.length;
  document.getElementById('occurrenceTotal').textContent = I18N.t('occurrenceUnit', { count: occurrenceTotal });
  document.getElementById('matchDays').textContent = I18N.t('dayUnit', { count: activeDayCount });
  document.getElementById('numberTotal').textContent = numberCount ? `${numberTotal}` : '-';
  renderLineChart(document.getElementById('occurrenceChart'), occurrenceRows, {
    name: I18N.t('occurrences'),
    integerOnly: true,
  });

  const numberPanel = document.getElementById('numberPanel');
  numberPanel.hidden = numberCount === 0;
  if (numberCount > 0) {
    renderLineChart(document.getElementById('numberChart'), numberRows, {
      name: I18N.t('numbers'),
      formatValue: (value) => String(value),
    });
  }

  renderResults(results, normalizedQuery);
}

async function initSearch() {
  I18N.initControls();
  searchItems = (await storageLoad()).map((item) => ({ ...item, doneAt: item.doneAt || item.createdAt }));
  const params = new URLSearchParams(location.search);
  renderSearch(params.get('q') || '');
  window.addEventListener('done-stack-language-change', () => renderSearch(params.get('q') || ''));
}

initSearch().catch((error) => {
  console.error('[search]', error);
  document.getElementById('resultList').innerHTML = `<div class="history-empty">${I18N.t('csvImportFailed')}</div>`;
});
