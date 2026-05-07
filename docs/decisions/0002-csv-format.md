# ADR 0002: CSV は id, createdAt, text のみ保存する

## Status

Accepted

## Context

CSV はバックアップと再取り込みに使います。
連番 ID は複数環境で重複しやすく、曜日や文字数や推定カテゴリは再計算できます。

## Decision

CSV は次の 3 カラムに統一します。

```csv
id,createdAt,text
```

- `id` は UUID
- `createdAt` は UTC の ISO 文字列
- `text` は本文

## Consequences

- 再取り込み時に UUID で重複を判定できます。
- タイムゾーンに依存しない日時を保存できます。
- 派生情報は保存せず、表示時に計算します。
