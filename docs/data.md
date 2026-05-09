# データ設計

## 保存先

Done データはブラウザ内に保存します。

優先保存先は IndexedDB です。

- DB 名: `done_stack_v1`
- Store 名: `items`

IndexedDB が使えない場合のみ localStorage にフォールバックします。

- key: `done_stack_items`

## Done データ

1 件の Done は次の形式です。

```js
{ id, text, createdAt, doneAt, updatedAt }
```

- `id`: UUID
- `text`: 入力本文
- `createdAt`: 記録を作成した日時。UTC の ISO 文字列
- `doneAt`: 実際に Done した日時。UTC の ISO 文字列
- `updatedAt`: 最後に編集・同期更新した日時。UTC の ISO 文字列

新規作成時は `createdAt` と `doneAt` に同じ `new Date().toISOString()` を入れます。
`doneAt` は編集画面から変更できます。
表示・履歴・検索グラフでは `doneAt` を基準にし、表示時だけブラウザのローカルタイムで整形します。

## ID

新規作成時は `storageCreateId()` で UUID を生成します。
古い数値 ID は `storageLoad()` 時に UUID へ移行します。

## CSV

CSV の形式は次の通りです。

```csv
id,createdAt,doneAt,text
"uuid","2026-05-05T20:47:39.000Z","2026-05-05T20:47:39.000Z","本文"
```

エクスポートファイル名は、ブラウザのローカル時刻を含めます。

```text
done_stack_YYYY-MM-DD_HH-mm-ss.csv
```

インポート時の挙動:

- 既存データと `id` が一致する行は無視します。
- CSV 内で同じ UUID が複数ある場合も、最初の 1 件だけ取り込みます。
- `doneAt` のない古い CSV は、`createdAt` と同じ日時として取り込みます。
- 曜日、文字数、推定カテゴリは保存せず、必要に応じて表示時に再計算します。

## Google Drive 同期

Google Drive 同期では、ユーザー本人の Google Drive の `appDataFolder` に `done_stack.json` を保存します。

同期ファイルの形式:

```js
{
  version: 1,
  updatedAt,
  items: [{ id, text, createdAt, doneAt, updatedAt }],
  deletedItems: { [id]: deletedAt }
}
```

同期時はローカルデータと Drive 上のデータを `id` 単位でマージします。
同じ `id` の記録は `updatedAt` が新しい方を採用します。
削除済みの `id` は `deletedItems` に記録し、削除時刻が記録の `updatedAt` より新しければ復活させません。
