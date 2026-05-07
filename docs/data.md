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
{ id, text, createdAt }
```

- `id`: UUID
- `text`: 入力本文
- `createdAt`: UTC の ISO 文字列

`createdAt` は保存時に `new Date().toISOString()` で作成します。
表示時だけブラウザのローカルタイムで整形します。

## ID

新規作成時は `storageCreateId()` で UUID を生成します。
古い数値 ID は `storageLoad()` 時に UUID へ移行します。

## CSV

CSV の形式は次の通りです。

```csv
id,createdAt,text
"uuid","2026-05-05T20:47:39.000Z","本文"
```

エクスポートファイル名は、ブラウザのローカル時刻を含めます。

```text
done_stack_YYYY-MM-DD_HH-mm-ss.csv
```

インポート時の挙動:

- 既存データと `id` が一致する行は無視します。
- CSV 内で同じ UUID が複数ある場合も、最初の 1 件だけ取り込みます。
- 曜日、文字数、推定カテゴリは保存せず、必要に応じて表示時に再計算します。
