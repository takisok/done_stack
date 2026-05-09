# Done Stack

Done Stack は、今日できたことを記録して積み上げていくローカル用のメモアプリです。
メイドさんとキーたんが、記録した達成を一緒に見守ってくれます。

## 主な機能

- 達成したことの記録
- 達成数カウンター
- Done リストの編集・削除
- 20 件ごとのページネーション
- 活動ログページでの月別ふりかえり
- CSV エクスポート / インポート
- ローカル LLM 接続時のキャラクターリアクション
- LLM 未接続時の静的セリフ

## 使い方

`index.html` をブラウザで開くと使えます。
データはブラウザ内に保存されます。

活動ログを見たい場合は、画面内のリンクまたは `history.html` を開いてください。

## iPhone で使う

GitHub Pages などの HTTPS URL で公開すると、iPhone の Safari から使えます。

1. Safari で GitHub Pages の URL を開きます。
2. 共有メニューから「ホーム画面に追加」を選びます。
3. ホーム画面のアイコンから起動します。

PWA 用に `manifest.json`、`sw.js`、ホーム画面アイコンを用意しています。

## LLM なしで使う

追加の準備は不要です。
キャラクターのセリフは、あらかじめ用意された静的なものになります。

## LLM ありで使う

ローカルの Ollama を使います。

1. 初回だけ `setup_ollama.bat` を実行します。
2. 使う前に `start_ollama.bat` を実行します。
3. `index.html` をブラウザで開きます。

画面上部に LLM 接続状態が表示されます。

## データについて

記録データはブラウザの IndexedDB に保存されます。
IndexedDB が使えない場合は localStorage に保存します。

CSV は次の形式で出力・読み込みします。

```csv
id,createdAt,doneAt,text
"uuid","2026-05-05T20:47:39.000Z","2026-05-05T20:47:39.000Z","本文"
```

`createdAt` は記録を作成した日時、`doneAt` は実際に Done した日時です。新規作成時は同じ日時になり、編集画面から `doneAt` を変更できます。
CSV 読み込み時、既存データと同じ `id` の行は取り込みません。

## Google Drive 同期

Google Drive 同期は、ユーザー本人の Google Drive のアプリ専用領域に `done_stack.json` を保存します。
使うには Google Cloud Console で OAuth クライアント ID を作り、`js/drive-sync.js` の `DONE_STACK_GOOGLE_CLIENT_ID` に設定してください。

アプリのメニューでは `Google Drive と同期` を押します。
未接続の場合は、その場で Google の許可画面を開いてから同期します。
接続中は、記録の追加・編集・削除後に自動同期します。

GitHub Pages で使う場合は、OAuth クライアントの承認済み JavaScript 生成元に Pages の origin を追加します。

```text
https://ユーザー名.github.io
```

リポジトリをプロジェクトページで公開している場合も、origin はパスなしの `https://ユーザー名.github.io` です。

## セキュリティについて

Done Stack は静的なブラウザアプリです。サーバー側にユーザーデータを保存せず、記録データは基本的にブラウザ内の IndexedDB に保存されます。
Google Drive 同期を使う場合も、Drive のアプリ専用領域である `appDataFolder` に `done_stack.json` を保存します。権限スコープは `https://www.googleapis.com/auth/drive.appdata` で、ユーザーの通常の Drive ファイル全体を読む権限ではありません。

現在の主な注意点と対策方針は次の通りです。

- 検索結果のグラフ表示では ECharts を `vendor/echarts/echarts.min.js` としてローカル同梱しています。外部CDNから実行時にスクリプトを読み込まないため、CDN由来の改ざんや停止の影響を受けにくくしています。
- LLM 接続時は、入力した Done 内容をローカルの Ollama (`http://localhost:11434`) に送信します。外部サービスへ送る設計ではありませんが、同じPC上のローカルプロセスに内容を渡すため、信頼できる Ollama を起動している状態で使ってください。
- Google Drive 同期では、Drive 上のデータが壊れていたり極端に大きかったりする場合に備えて、同期データのサイズ上限、件数上限、日付形式チェックを入れています。

Drive 同期データの現在の上限は次の通りです。

- `done_stack.json` の本文サイズ: 最大 20MB
- Done 件数: 最大 100,000 件
- 削除ログ件数: 最大 100,000 件
- Done 本文: 最大 1024 文字
- `createdAt` / `doneAt` / `updatedAt` / 削除日時: JavaScript の `Date.parse()` で解釈できる文字列のみ

今後さらに堅くするなら、次の対応が候補です。

- 外部から翻訳文やテーマ設定を読み込むようになった場合は、HTMLとして挿入せず `textContent` を基本にする

Drive 同期で問題が起きた場合は、できるだけ原因が分かるメッセージを表示します。
たとえば、`done_stack.json` のサイズ超過、JSONの破損、Done件数の上限超過、本文文字数の上限超過、日付形式の不正、削除ログの上限超過などを区別します。

### Content Security Policy

`index.html`、`history.html`、`search.html`、`settings.html` には Content Security Policy を設定しています。
アプリ自身のファイルを基本にしつつ、Google Drive 同期に必要な Google Identity Services / Google API と、ローカル LLM 用の Ollama (`http://localhost:11434` / `http://127.0.0.1:11434`) への通信だけを許可しています。

主な制限は次の通りです。

- スクリプト: アプリ自身、`accounts.google.com`、`apis.google.com`、`content.googleapis.com`
- 通信先: アプリ自身、Ollama、Google API 関連
- 画像: アプリ自身と `data:`
- Service Worker / manifest: アプリ自身
- iframe: Google OAuth / API 関連
- `object` タグ: 禁止

## 同梱ライブラリ

- Apache ECharts 5.5.1
  - ファイル: `vendor/echarts/echarts.min.js`
  - ライセンス: Apache License 2.0
  - ライセンス本文: `vendor/echarts/LICENSE`
  - 公式サイト: https://echarts.apache.org/

## 詳細ドキュメント

- アプリ仕様: `docs/specification.md`
- データ設計: `docs/data.md`
- キャラクター設計: `docs/characters.md`
- 設計判断の記録: `docs/decisions/`
