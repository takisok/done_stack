# Done Stack ✨ 積み上げろ！

今日達成したことを記録して積み上げていくモチベーション管理アプリです。
メイドキャラクターとマスコットが達成を一緒に喜んでくれます。

## 機能

- 達成したことをテキストで記録
- 達成数カウンター
- キャラクターによるリアクション（ローカルLLM連携時はAI生成セリフ）
- 記録の編集・削除
- CSVエクスポート
- データはブラウザのIndexedDB（またはlocalStorage）に保存

## 使い方

### LLMなしで使う場合

`index.html` をブラウザで開くだけで動作します。キャラクターのセリフは静的なものになります。

### LLMありで使う場合（Ollamaを使用）

1. **初回セットアップ**（Ollamaとモデルのインストール）

   ```
   setup_ollama.bat を実行
   ```

2. **Ollama サーバーの起動**（毎回必要）

   ```
   start_ollama.bat を実行
   ```

3. `index.html` をブラウザで開く

画面下部に「LLM 接続中 · gemma4:latest」と表示されれば接続完了です。

## 構成

```
done_stack/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js        # メインロジック
│   ├── llm.js        # Ollama連携
│   ├── speech.js     # 静的セリフ
│   ├── storage.js    # データ保存（IndexedDB / localStorage）
│   └── stars.js      # パーティクルエフェクト
├── img/
│   ├── maid/         # メイドキャラクター画像
│   └── mascot/       # マスコット画像
├── setup_ollama.bat  # Ollamaセットアップ
└── start_ollama.bat  # Ollama起動（CORS設定付き）
```

## LLM設定

`js/llm.js` の `LLM_CONFIG` で変更できます。

```js
const LLM_CONFIG = {
  baseUrl: 'http://localhost:11434',  // OllamaのURL
  model:   'gemma4:latest',           // 使用するモデル
  timeout: 15000,                     // タイムアウト（ms）
};
```

## 注意事項

`file://` でブラウザから直接開く場合、OllamaはCORSを許可した状態で起動する必要があります。
`start_ollama.bat` は `OLLAMA_ORIGINS=*` を設定済みです。
