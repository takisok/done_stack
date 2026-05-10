const I18N_STORAGE_KEY = 'done_stack_language';
const USER_NAME_STORAGE_KEY = 'done_stack_user_name';

const I18N_MESSAGES = {
  ja: {
    appName: 'できたスタンプ💮',
    homeTitle: 'できたスタンプ💮',
    aboutPageTitle: 'できたスタンプ💮 - このアプリについて',
    settingsPageTitle: 'できたスタンプ💮 - 設定',
    historyPageTitle: 'できたスタンプ💮 - 活動ログ',
    searchPageTitle: 'できたスタンプ💮 - 検索',
    privacyPageTitle: 'できたスタンプ💮 - プライバシーポリシー',
    aboutKicker: 'できたスタンプ💮について',
    search: '⌕ 検索',
    searchAria: 'Doneを検索',
    settings: '⚙ 設定',
    settingsTitle: '設定',
    userName: 'ユーザー名',
    userNameDescription: 'キャラクターが呼びかけるときに使います。',
    userNamePlaceholder: '例： たろう',
    languageDescription: '画面に表示する言語を選びます。',
    dataManagement: 'データ管理',
    aboutApp: 'このアプリについて',
    aboutAppDescription: 'できたスタンプ💮の考え方、使い方、データ保存について確認できます。',
    openAbout: '紹介ページを開く',
    privacyPolicy: 'プライバシーポリシー',
    backToAbout: '紹介へ戻る',
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
    doneButton: 'できた！',
    listTitle: 'できた！ことのリスト',
    emptyList: 'まだ何も積み上がっていません。<br>最初の一歩を踏み出しましょう！',
    edit: '▸ 編集',
    doneAt: 'Done日時',
    createdAt: '記録作成日時',
    delete: '削除',
    cancel: 'キャンセル',
    save: '保存',
    backToInput: '入力へ戻る',
    startUsing: '使ってみる',
    aboutHeroTitle: '案外がんばっていた自分に気付く。',
    aboutHeroLead: '「できたスタンプ💮」は、小さな達成を記録することで、次の一歩を踏み出しやすくするための記録アプリです。「何かを始めようと思った」「気になっていたことを検索した」「一行だけドキュメントを書き進めた」そんな些細なことでも記録を残すことで、毎日が少しだけ楽しく感じられることを目指しています。',
    aboutWhatTitle: 'できたスタンプ💮とは',
    aboutWhatBody: '「できたスタンプ💮」は、タスクを管理するのではなく、すでにできたことを残すためのツールです。些細なことでも「できた」の履歴を残すことで、後から振り返ることができます。ゲームの得点のように、数字が増えるのを見るだけで少し前向きになれる……そんな気持ちを日常に生かすことができれば幸いです。',
    aboutHowTitle: '使い方',
    aboutHowOne: '入力欄に行ったことを書いて「できた！」を押します。行動まで至らなくても、思い立っただけでもそれは前向きなこととして記録して構いません。',
    aboutHowTwo: '記入が面倒な場合は空欄で「できた！」ボタンのみ押すことも可能です。この場合は [空欄のできた] として保存されます。',
    aboutHowThree: '活動ログや検索結果のページで、これまでに積み重ねた「できた！」を振り返ることができます。',
    aboutHowFour: 'iPhoneやスマホでは、ブラウザの共有メニューからホーム画面に追加できます。',
    aboutDataTitle: 'データ保存',
    aboutDataBody: '記録したデータは基本的にブラウザ内のIndexedDBに保存されます。多数のデバイスでデータを同期したい場合にはGoogle Driveを利用します。この場合もユーザーのGoogle Driveのアプリ専用領域に保存します。できたスタンプ💮のサーバーに記録を預ける設計ではありません。開発側がユーザーのデータを閲覧、管理することはできない設計になっています。',
    aboutCharactersTitle: 'メイさんとキーたん',
    aboutCharactersBody: 'メイさんは、エプロンに小さなクッキー型ワッペンをつけた、現実を知っている優しさ担当のメイドさんです。キーたんは、丸くてもふもふでかわいいけれど少しシニカルなマスコットです。二人が、あなたのできたことをそれぞれの距離感で見守ります。',
    aboutExamplesKicker: 'Tiny Done Examples',
    aboutExamplesTitle: 'こんなこともDoneでいい',
    aboutExampleOne: '今日も一日がんばった！',
    aboutExampleTwo: '5分だけ作業を進めた',
    aboutExampleThree: 'やらなければならない仕事をリストアップした',
    aboutExampleFour: '前向きな気持ちになった',
    aboutExampleFive: '深呼吸をした',
    aboutExampleSix: '今日も生きている',
    aboutPrivacyBody: 'データの保存場所、Google Drive同期、ローカルLLM連携、問い合わせ先について確認できます。',
    privacyKicker: 'Privacy Policy',
    privacyTitle: 'プライバシーポリシー',
    privacyIntro: 'できたスタンプ💮（以下「本アプリ」）は、ユーザーが日々の達成を記録するためのブラウザアプリです。本アプリは、開発者が管理するサーバーにユーザーの記録データを保存しません。',
    privacyStoredTitle: '1. 保存される情報',
    privacyStoredBody: '本アプリでは、ユーザーが入力した記録本文、作成日時、達成日時、削除ログ、ユーザー名や言語などの設定情報を保存します。これらの情報は、通常、ユーザーのブラウザ内のIndexedDBに保存されます。IndexedDBが利用できない場合はlocalStorageに保存されることがあります。',
    privacyDriveTitle: '2. Google Drive同期',
    privacyDriveBody: 'ユーザーがGoogle Drive同期を有効にした場合、本アプリはユーザー本人のGoogle Driveのアプリ専用領域に同期データを保存します。利用するGoogle APIのスコープは https://www.googleapis.com/auth/drive.appdata です。このスコープは、本アプリが作成・使用するアプリ専用データを扱うためのものであり、ユーザーの通常のGoogle Driveファイル全体を閲覧する目的ではありません。',
    privacyGoogleUseBody: '本アプリがGoogle APIから取得した情報は、Google Drive同期機能の提供のみに使用し、広告、分析、第三者提供、AIモデルの学習には使用しません。',
    privacyLlmTitle: '3. ローカルLLM連携',
    privacyLlmBody: 'ユーザーがローカルLLM連携を利用する場合、入力された記録内容はユーザーの端末上で動作するOllamaに送信されます。本アプリは、外部のLLMサービスへ記録内容を送信する設計ではありません。',
    privacyThirdPartyTitle: '4. 第三者提供',
    privacyThirdPartyBody: '開発者は、ユーザーの記録データを取得、閲覧、販売、第三者提供しません。ただし、Google Drive同期を利用する場合は、Googleのサービスを通じてデータが保存されます。',
    privacyDeleteTitle: '5. データの削除',
    privacyDeleteBody: 'ユーザーは、ブラウザのサイトデータを削除することで、ローカルに保存されたデータを削除できます。Google Drive同期を利用している場合は、Googleアカウント側のアプリデータを削除することで、同期データを削除できます。CSVとしてエクスポートしたファイルは、ユーザー自身が管理・削除してください。',
    privacyDisclaimerTitle: '6. 免責',
    privacyDisclaimerBody: '本アプリは、ユーザーの端末、ブラウザ、Google Driveの状態により、データの保存や同期が正常に行われない場合があります。重要なデータは、必要に応じてCSVエクスポートなどでバックアップしてください。',
    privacyRevisionTitle: '7. 改定',
    privacyRevisionBody: '本ポリシーは、必要に応じて変更されることがあります。重要な変更がある場合は、本アプリまたは公開ページ上で案内します。',
    privacyContactTitle: '8. 問い合わせ',
    privacyContactBody: '本ポリシーに関する問い合わせは、以下の連絡先までお願いします。',
    privacyRelatedTitle: '9. ライセンス',
    privacyRelatedBody: '本アプリ本体の利用条件と、同梱している第三者ライブラリのライセンスは以下から確認できます。',
    appLicense: 'アプリ本体のライセンス',
    thirdPartyNotices: '第三者ライブラリのライセンス表示',
    monthlyDone: 'Monthly Done',
    activeDays: '活動日',
    bestDay: '最多の日',
    topCategory: '主な活動',
    contribution: '活動履歴',
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
    csvHeaderError: 'CSVのヘッダーは id,createdAt,doneAt,text の形式にしてください。',
    csvEmptyError: '{line}行目に空の項目があります。',
    csvDateError: '{line}行目の日付が日時として読めません。',
    blankDone: '[空欄のできた]',
    editHint: '✎ 編集',
    milestone_1: '最初の一歩。ここから始まる。',
    milestone_5: '5達成。ペースが生まれてきた。',
    milestone_10: '10達成。二桁の領域へ。',
    milestone_20: '20達成。習慣になりつつある。',
    milestone_50: '50達成。本物の積み上げだ。',
    milestone_100: '100達成。伝説の始まり。',
    milestone_200: '200達成。もう止まらない。',
    milestone_500: '500達成。圧倒的な軌跡。',
    milestone_1000: '1000達成。あなたは伝説だ。',
  },
  en: {
    appName: 'Dekita Stamp💮',
    homeTitle: 'Dekita Stamp💮',
    aboutPageTitle: 'Dekita Stamp💮 - About',
    settingsPageTitle: 'Dekita Stamp💮 - Settings',
    historyPageTitle: 'Dekita Stamp💮 - Activity Log',
    searchPageTitle: 'Dekita Stamp💮 - Search',
    privacyPageTitle: 'Dekita Stamp💮 - Privacy Policy',
    aboutKicker: 'About Dekita Stamp💮',
    search: '⌕ Search',
    searchAria: 'Search Done entries',
    settings: '⚙ Settings',
    settingsTitle: 'Settings',
    userName: 'User name',
    userNameDescription: 'Characters may use this when speaking to you.',
    userNamePlaceholder: 'e.g. John Doe',
    languageDescription: 'Choose the language shown in the app.',
    dataManagement: 'Data Management',
    aboutApp: 'About this app',
    aboutAppDescription: 'Read about Dekita Stamp💮, how it works, and where your data is stored.',
    openAbout: 'Open About',
    privacyPolicy: 'Privacy Policy',
    backToAbout: 'Back to About',
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
    doneAt: 'Done date',
    createdAt: 'Created',
    delete: 'Delete',
    cancel: 'Cancel',
    save: 'Save',
    backToInput: 'Back',
    startUsing: 'Start using it',
    aboutHeroTitle: 'Notice that you were doing more than you thought.',
    aboutHeroLead: 'Dekita Stamp💮 is a record app that helps you take the next step by saving small achievements. Even tiny things count: thinking about starting something, beginning to research what action is needed, or writing just one line of a document. By leaving those traces behind, the app aims to make each day feel a little more enjoyable.',
    aboutWhatTitle: 'What Dekita Stamp💮 is',
    aboutWhatBody: 'It is not a tool for perfect task management. It is a place to acknowledge what already happened. On productive days and on suspiciously low-output days, one tiny Done is enough.',
    aboutHowTitle: 'How to use it',
    aboutHowOne: 'Write what you did in the input field, then press Done. Even if you have not acted yet, simply deciding to start can be recorded as something positive.',
    aboutHowTwo: 'If writing feels like too much, you can press Done with the input left blank. In that case, it will be saved as [Blank Done].',
    aboutHowThree: 'Use Activity Log and Search to look back at what you have stacked.',
    aboutHowFour: 'On iPhone or other phones, add it to your home screen from the browser share menu.',
    aboutDataTitle: 'Data storage',
    aboutDataBody: 'Your recorded data is stored in IndexedDB inside your browser by default. If you want to sync across multiple devices, Dekita Stamp💮 uses Google Drive. Even then, the data is saved in the app-specific area of your own Google Drive. Dekita Stamp💮 is not designed to store your entries on its own server, and the developer cannot view or manage user data.',
    aboutCharactersTitle: 'Mei and Keytan',
    aboutCharactersBody: 'Mei is a kind maid with a small cookie patch on her apron and a very real sense of how daily life falls apart. Keytan is a round, fluffy mascot who looks cute but comments with a dry, cynical edge. Together, they watch over what you were able to do in their own different ways.',
    aboutExamplesKicker: 'Tiny Done Examples',
    aboutExamplesTitle: 'These count too',
    aboutExampleOne: 'Put my phone down',
    aboutExampleTwo: 'Checked what day it is',
    aboutExampleThree: 'Noticed I have no motivation',
    aboutExampleFour: 'Acknowledged the laundry exists',
    aboutExampleFive: 'Took a deep breath',
    aboutExampleSix: 'Still alive today',
    aboutPrivacyBody: 'Read about where data is stored, Google Drive sync, local LLM integration, and contact information.',
    privacyKicker: 'Privacy Policy',
    privacyTitle: 'Privacy Policy',
    privacyIntro: 'Dekita Stamp💮 (the "App") is a browser app for recording everyday accomplishments. The App does not store user records on a server managed by the developer.',
    privacyStoredTitle: '1. Information stored',
    privacyStoredBody: 'The App stores record text entered by the user, creation dates, accomplishment dates, deletion logs, and settings such as user name and language. This information is normally stored in IndexedDB inside the user’s browser. If IndexedDB is unavailable, localStorage may be used instead.',
    privacyDriveTitle: '2. Google Drive sync',
    privacyDriveBody: 'If the user enables Google Drive sync, the App stores sync data in the app-specific area of the user’s own Google Drive. The Google API scope used is https://www.googleapis.com/auth/drive.appdata. This scope is used to handle app-specific data created or used by the App, and is not intended to read the user’s regular Google Drive files.',
    privacyGoogleUseBody: 'Information obtained from Google APIs is used only to provide Google Drive sync. It is not used for advertising, analytics, third-party sharing, or AI model training.',
    privacyLlmTitle: '3. Local LLM integration',
    privacyLlmBody: 'If the user uses local LLM integration, entered record content is sent to Ollama running on the user’s own device. The App is not designed to send record content to external LLM services.',
    privacyThirdPartyTitle: '4. Third-party sharing',
    privacyThirdPartyBody: 'The developer does not collect, view, sell, or share user record data with third parties. However, when Google Drive sync is used, data is stored through Google services.',
    privacyDeleteTitle: '5. Data deletion',
    privacyDeleteBody: 'Users can delete locally stored data by deleting browser site data. If Google Drive sync is used, sync data can be deleted by removing app data from the Google account. CSV files exported by the user should be managed and deleted by the user.',
    privacyDisclaimerTitle: '6. Disclaimer',
    privacyDisclaimerBody: 'Depending on the user’s device, browser, or Google Drive state, saving or syncing data may not work correctly. Important data should be backed up as needed, for example by CSV export.',
    privacyRevisionTitle: '7. Changes',
    privacyRevisionBody: 'This policy may be changed as needed. Important changes will be announced in the App or on the public page.',
    privacyContactTitle: '8. Contact',
    privacyContactBody: 'For questions about this policy, please contact:',
    privacyRelatedTitle: '9. Licenses',
    privacyRelatedBody: 'You can review the license terms for this app and the notices for bundled third-party software below.',
    appLicense: 'App license',
    thirdPartyNotices: 'Third-party notices',
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
    csvHeaderError: 'CSV header must be id,createdAt,doneAt,text.',
    csvEmptyError: 'Line {line} has an empty field.',
    csvDateError: 'Line {line} has an invalid date.',
    blankDone: '[Blank Done]',
    editHint: '✎ Edit',
    milestone_1: 'First step taken. It starts here.',
    milestone_5: '5 done. Finding your rhythm.',
    milestone_10: '10 done. Into double digits.',
    milestone_20: '20 done. Becoming a habit.',
    milestone_50: '50 done. A real stack.',
    milestone_100: '100 done. The legend begins.',
    milestone_200: '200 done. Unstoppable.',
    milestone_500: '500 done. An overwhelming track record.',
    milestone_1000: '1000 done. You are a legend.',
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

function getUserName() {
  try {
    return String(localStorage.getItem(USER_NAME_STORAGE_KEY) || '').trim();
  } catch {
    return '';
  }
}

function setUserName(name) {
  const normalized = String(name || '').trim().slice(0, 40);
  try {
    if (normalized) {
      localStorage.setItem(USER_NAME_STORAGE_KEY, normalized);
    } else {
      localStorage.removeItem(USER_NAME_STORAGE_KEY);
    }
  } catch { /* localStorage unavailable */ }
  window.dispatchEvent(new CustomEvent('done-stack-user-name-change', { detail: { userName: normalized } }));
  return normalized;
}

window.I18N = {
  t: translate,
  getLanguage: getCurrentLanguage,
  setLanguage: setCurrentLanguage,
  getUserName,
  setUserName,
  apply: applyTranslations,
  initControls: initLanguageControls,
};
