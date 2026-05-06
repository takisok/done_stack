/* =====================================================
   llm.js — Ollama (Gemma4) ローカルLLM連携
   依存なし。app.js より先に読み込むこと。

   使い方:
     checkLLMAvailable()          → Promise<boolean>
     getMaidLLMResponse(text, cb) → Promise<void>  (cb: chunk => void)
     getMascotLLMResponse(text)   → Promise<string>

   Ollama 起動コマンド例 (file:// から使う場合):
     OLLAMA_ORIGINS=* ollama serve
   ===================================================== */

const LLM_CONFIG = {
  baseUrl: 'http://localhost:11434',
  model:   'gemma4:latest',
  timeout: 15000,
};

// null=未確認 / true=利用可 / false=利用不可
let llmAvailable = null;

function setLLMStatus(state) {
  const el = document.getElementById('llmStatus');
  if (!el) return;
  const labels = { checking: 'LLM 確認中…', on: `LLM 接続中 · ${LLM_CONFIG.model}`, off: 'LLM オフライン' };
  el.dataset.state = state;
  el.querySelector('.llm-label').textContent = labels[state] ?? state;
}

async function checkLLMAvailable() {
  setLLMStatus('checking');
  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 3000);
    const res  = await fetch(`${LLM_CONFIG.baseUrl}/api/tags`, { signal: ctrl.signal });
    clearTimeout(tid);
    llmAvailable = res.ok;
  } catch {
    llmAvailable = false;
  }
  setLLMStatus(llmAvailable ? 'on' : 'off');
  return llmAvailable;
}

/**
 * Ollama /api/chat にストリーミングリクエストを送る。
 * @param {string}   systemPrompt
 * @param {string}   userPrompt
 * @param {function} onChunk  - 受信チャンクごとに呼ばれる (chunk: string) => void
 */
async function streamGenerate(systemPrompt, userPrompt, onChunk) {
  const ctrl = new AbortController();
  const tid  = setTimeout(() => ctrl.abort(), LLM_CONFIG.timeout);

  const res = await fetch(`${LLM_CONFIG.baseUrl}/api/chat`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    signal:  ctrl.signal,
    body: JSON.stringify({
      model:  LLM_CONFIG.model,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    }),
  });

  clearTimeout(tid);

  if (!res.ok) throw new Error(`Ollama HTTP ${res.status}`);

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  let   buf     = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();   // 最後の不完全行をバッファに残す

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const obj = JSON.parse(line);
        const chunk = obj?.message?.content;
        if (chunk) onChunk(chunk);
      } catch { /* 壊れた行は無視 */ }
    }
  }
}

// ── キャラクター別システムプロンプト ─────────────────

const MAID_SYSTEM = `あなたは「Done Stack」というアプリのメイドキャラクターです。
ユーザーが達成したことを報告してくれたとき、一言か二言で褒めてあげてください。
話し方: 明るく丁寧。ですます調で話します。
モチベーションをアップさせるためにどう褒めるかをいつも考えています。
発明や発見をした場合は、それが作り出す未来について思いを馳せたりします。
ユーザーの達成内容を引用・復唱しないでください。
絵文字も使います。達成感の強い報告をした場合は、大量の絵文字で感情を表すこともあります。
改行は1回まで。100文字以内で答えてください。
返答はキャラクターのセリフのみ。説明や前置きは不要です。`;

const MASCOT_SYSTEM = `あなたは「Done Stack」というアプリの男のマスコットキャラクターです。
ユーザーが達成したことを報告してくれたとき、シニカルでぶっきらぼうに一言コメントしてください。
話し方: 素っ気なく、棒読み気味。褒めるとしても渋々。ツッコミや皮肉もOK。
60文字以内で答えること。返答はキャラクターのセリフのみで説明や前置き、「」などは不要です。`;

/**
 * メイドのLLMセリフをストリーミングで取得する。
 * @param {string}   doneText  ユーザーの達成内容
 * @param {function} onChunk   チャンク受信コールバック
 */
async function getMaidLLMResponse(doneText, onChunk) {
  if (!llmAvailable) throw new Error('LLM unavailable');
  await streamGenerate(
    MAID_SYSTEM,
    `達成内容：「${doneText}」`,
    onChunk,
  );
}

/**
 * マスコットのLLMセリフを一括で取得する（ストリーミングを内部で収集）。
 * @param {string} doneText
 * @returns {Promise<string>}
 */
async function getMascotLLMResponse(doneText) {
  if (!llmAvailable) throw new Error('LLM unavailable');
  let result = '';
  await streamGenerate(
    MASCOT_SYSTEM,
    `達成内容：「${doneText}」`,
    chunk => { result += chunk; },
  );
  return result.trim();
}
