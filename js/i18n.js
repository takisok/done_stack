const I18N_STORAGE_KEY = 'done_stack_language';

const I18N_MESSAGES = {
  ja: {
    search: '検索',
    searchAria: 'Doneを検索',
    settings: '⚙ 設定',
    activityLog: '活動ログ',
    syncDrive: 'Google Drive と同期',
    importCsv: 'CSV を読み込み',
    exportCsv: 'CSV として出力',
    language: '言語',
    languageJa: '日本語',
    languageEn: 'English',
    llmChecking: 'LLM 確認中…',
    llmOn: 'LLM 接続中 · {model}',
    llmOff: 'LLM オフライン',
    countLabel: '達成数',
    inputHint: '▸ 今日達成したことを入力',
    doneButton: '✓ Done!',
    listTitle: '▸ 積み上げリスト',
    emptyList: 'まだ何も積み上がっていません。<br>最初の一歩を踏み出しましょう！',
    edit: '▸ 編集',
    delete: '削除',
    cancel: 'キャンセル',
    save: '保存',
    backToInput: '入力へ戻る',
    monthlyDone: 'Monthly Done',
    activeDays: '活動日',
    bestDay: '最多の日',
    topCategory: '主な活動',
    contribution: '活動の草',
    recentYear: '直近1年',
    less: '少ない',
    more: '多い',
    thisMonthRecords: 'この月の記録',
    monthRecordSummary: 'この月に積み上げた活動を日付ごとに表示します。',
    monthlyInsights: 'Monthly Insights',
    thisMonthTrends: 'この月の傾向',
    monthlyScope: '月間集計',
    category: 'カテゴリ',
    keywords: 'よく出た言葉',
    top: '上位',
    highlights: '月間ハイライト',
    prevMonth: '前の月',
    nextMonth: '次の月',
    thisMonth: '今月',
    searchResults: '検索結果',
    matches: 'Matches',
    occurrences: '出現回数',
    activeDaysShort: '活動日',
    numbers: '数値',
    daily: '日別',
    numbersInDone: '検索語を含むDone内の数値',
    done: 'Done',
    noResults: '該当するDoneはありません。',
    noChartData: '該当するデータはありません。',
    enterSearchTerm: '検索したい単語を入力してください。',
    searchTitle: '「{query}」の検索結果',
    occurrenceUnit: '{count}回',
    dayUnit: '{count}日',
    itemUnit: '{count}件',
    numberLabel: '数値: {numbers}',
    pageInfo: '{current} / {total}',
    prev: '前へ',
    next: '次へ',
    noData: 'まだデータがありません。',
    textRequired: 'テキストを入力してください',
    confirmDelete: 'この記録を削除しますか？',
    importDone: '{count}件を取り込みました',
    csvImportFailed: 'CSVの読み込みに失敗しました。',
    csvHeaderError: 'CSVのヘッダーは id,createdAt,text の形式にしてください。',
    csvEmptyError: '{line}行目に空の項目があります。',
    csvDateError: '{line}行目のcreatedAtが日時として読めません。',
    blankDone: '[空欄のDone]',
  },
  en: {
    search: 'Search',
    searchAria: 'Search Done entries',
    settings: '⚙ Settings',
    activityLog: 'Activity Log',
    syncDrive: 'Sync with Google Drive',
    importCsv: 'Import CSV',
    exportCsv: 'Export CSV',
    language: 'Language',
    languageJa: '日本語',
    languageEn: 'English',
    llmChecking: 'Checking LLM...',
    llmOn: 'LLM connected · {model}',
    llmOff: 'LLM offline',
    countLabel: 'Done Count',
    inputHint: '▸ What did you do today?',
    doneButton: '✓ Done!',
    listTitle: '▸ Done List',
    emptyList: 'Nothing stacked yet.<br>Take the tiniest first step.',
    edit: '▸ Edit',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    backToInput: 'Back',
    monthlyDone: 'Monthly Done',
    activeDays: 'Active Days',
    bestDay: 'Best Day',
    topCategory: 'Top Activity',
    contribution: 'Activity Grid',
    recentYear: 'Last year',
    less: 'Less',
    more: 'More',
    thisMonthRecords: 'This Month',
    monthRecordSummary: 'Done entries for this month are grouped by date.',
    monthlyInsights: 'Monthly Insights',
    thisMonthTrends: 'Trends',
    monthlyScope: 'Monthly Summary',
    category: 'Categories',
    keywords: 'Frequent Words',
    top: 'Top',
    highlights: 'Highlights',
    prevMonth: 'Previous month',
    nextMonth: 'Next month',
    thisMonth: 'This Month',
    searchResults: 'Search Results',
    matches: 'Matches',
    occurrences: 'Occurrences',
    activeDaysShort: 'Active Days',
    numbers: 'Numbers',
    daily: 'Daily',
    numbersInDone: 'Numbers in matching Done entries',
    done: 'Done',
    noResults: 'No matching Done entries.',
    noChartData: 'No matching data.',
    enterSearchTerm: 'Enter a word to search.',
    searchTitle: 'Results for "{query}"',
    occurrenceUnit: '{count}',
    dayUnit: '{count} days',
    itemUnit: '{count} items',
    numberLabel: 'Numbers: {numbers}',
    pageInfo: '{current} / {total}',
    prev: 'Prev',
    next: 'Next',
    noData: 'No data yet.',
    textRequired: 'Please enter text',
    confirmDelete: 'Delete this entry?',
    importDone: 'Imported {count} entries',
    csvImportFailed: 'Failed to import CSV.',
    csvHeaderError: 'CSV header must be id,createdAt,text.',
    csvEmptyError: 'Line {line} has an empty field.',
    csvDateError: 'Line {line} createdAt is not a valid date.',
    blankDone: '[Blank Done]',
  },
};

function getCurrentLanguage() {
  const saved = localStorage.getItem(I18N_STORAGE_KEY);
  return saved === 'en' ? 'en' : 'ja';
}

function setCurrentLanguage(lang) {
  const nextLang = lang === 'en' ? 'en' : 'ja';
  localStorage.setItem(I18N_STORAGE_KEY, nextLang);
  document.documentElement.lang = nextLang;
}

function translate(key, values = {}) {
  const lang = getCurrentLanguage();
  const template = I18N_MESSAGES[lang]?.[key] ?? I18N_MESSAGES.ja[key] ?? key;
  return String(template).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? '');
}

function applyTranslations(root = document) {
  document.documentElement.lang = getCurrentLanguage();
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.innerHTML = translate(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = translate(el.dataset.i18nPlaceholder);
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((el) => {
    el.setAttribute('aria-label', translate(el.dataset.i18nAriaLabel));
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = translate(el.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-language-select]').forEach((select) => {
    select.value = getCurrentLanguage();
  });
}

function initLanguageControls() {
  applyTranslations();
  document.querySelectorAll('[data-language-select]').forEach((select) => {
    select.addEventListener('change', () => {
      setCurrentLanguage(select.value);
      applyTranslations();
      window.dispatchEvent(new CustomEvent('done-stack-language-change'));
    });
  });
}

window.I18N = {
  t: translate,
  getLanguage: getCurrentLanguage,
  setLanguage: setCurrentLanguage,
  apply: applyTranslations,
  initControls: initLanguageControls,
};
