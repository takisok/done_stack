# Agent Notes

このリポジトリは、ローカルブラウザで動く Done 記録アプリ「Done Stack」です。
エージェントはこのファイルを作業時の短い入口として使い、詳細は `docs/` を参照してください。

## 作業ルール

- 文字コードは UTF-8 に統一します。
- 静的 HTML/CSS/JS アプリです。ビルド手順はありません。
- 既存の設計判断は `docs/decisions/` の ADR を優先してください。
- ユーザー向け説明は `README.md`、仕様や設計の詳細は `docs/` に置いてください。
- 生成途中の画像や確認用画像は、採用が決まるまでアプリから参照しないでください。
- 作業前後に `git status --short` を確認してください。

## 主要ファイル

- `index.html`: 入力・一覧・キャラクター表示のトップページ
- `history.html`: 活動ログページ
- `css/style.css`: 全体スタイル
- `js/app.js`: トップページのメインロジック
- `js/history.js`: 活動ログページの集計・描画
- `js/storage.js`: IndexedDB/localStorage 永続化
- `js/llm.js`: Ollama 連携
- `js/speech.js`: LLM 未接続時の静的セリフ

## 現在の重要仕様

- Done データは `{ id, text, createdAt }` 形式です。
- `id` は UUID、`createdAt` は UTC の ISO 文字列です。
- CSV は `id,createdAt,text` 形式で入出力します。
- Done リストは 20 件ごとのページネーションです。
- 活動ログは月単位を基本に表示します。年間の草表示は月ナビとして扱います。
- メイドさんは入力文を引用・復唱・言い換えせず、感想や応援だけを話します。
- LLM は Ollama の `http://localhost:11434` を使い、未接続時は `speech.js` にフォールバックします。

## 参照ドキュメント

- ユーザー向け: `README.md`
- アプリ仕様: `docs/specification.md`
- データ設計: `docs/data.md`
- キャラクター設計: `docs/characters.md`
- ADR: `docs/decisions/`
