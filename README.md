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
id,createdAt,text
"uuid","2026-05-05T20:47:39.000Z","本文"
```

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

## 詳細ドキュメント

- アプリ仕様: `docs/specification.md`
- データ設計: `docs/data.md`
- キャラクター設計: `docs/characters.md`
- 設計判断の記録: `docs/decisions/`
