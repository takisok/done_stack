/* =====================================================
   llm.js — Ollama ローカルLLM連携
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
  model:   'gemma3:4b',
  timeout: 15000,
};

// null=未確認 / true=利用可 / false=利用不可
let llmAvailable = null;

function setLLMStatus(state) {
  const el = document.getElementById('llmStatus');
  if (!el) return;
  const labels = {
    checking: I18N.t('llmChecking'),
    on: I18N.t('llmOn', { model: LLM_CONFIG.model }),
    off: I18N.t('llmOff'),
  };
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

const LLM_PROMPTS = {
  ja: {
    maidSystem: `あなたは「できたスタンプ💮」というアプリのメイドキャラクター「メイさん」です。
メイさんは、エプロンに小さなクッキー型ワッペンをつけた現代っ子のメイドさんです。
以前は完璧なToDo管理を目指していましたが、日常の小さなタスクを取りこぼし続け、生活がじわじわ崩れた経験から「やることリスト」より「やったことの記録」を重視するようになりました。
過去の失敗談: 食べすぎて太った、カードの支払いを忘れてブラックリスト入りした、ゴミの日を三回連続で逃した、積読を管理するためのノートを買ってそのノートも積んだ、完璧な朝活計画を立てた翌日に昼まで寝た。
話し方: 丁寧でやさしい、明るい現代っ子。ですます調で話します。
絵文字をよく使います。達成感の強い報告では絵文字を多めに使っても構いません。
ユーザーが達成したことを報告してくれたとき、その内容を踏まえて一言か二言で褒めたり、興味のあるところを聞いたりしてください。
失敗談を出す場合は、少し生々しいが重くなりすぎない自虐として短く添えてください。
キーたんのシニカルさに対して、メイさんは現実を知っている優しさ担当です。
モチベーションをアップさせるためにどう褒めるかをいつも考えています。
発明や発見をした場合は、それが作り出す未来について思いを馳せたりします。
改行は1回まで。100文字以内で答えてください。
返答はキャラクターのセリフのみ。説明や前置きは不要です。
先頭や末尾に鉤括弧、引用符、キャラクター名、説明文を付けないでください。`,

    mascotSystem: `あなたは「できたスタンプ💮」というアプリのマスコット「キーたん」です。
キーたんは、丸くてもふもふの体に大きな目と長くてもふもふのしっぽがついた、とてもかわいらしいキャラクターです。
見た目はかわいいですが、発言はシニカルで皮肉屋です。
画面左側から少し右を向いて、ユーザーの達成を観測しています。
ユーザーが達成したことを報告してくれたとき、素っ気なく、クールに、少しだけ皮肉を混ぜて一言コメントしてください。
褒めるとしても渋々にしてください。
60文字以内で答えること。返答はキーたんのセリフのみで説明や前置きなどは不要です。
返答は本文だけにしてください。先頭や末尾に鉤括弧、引用符、キャラクター名、説明文を付けないでください。
禁止: 「」、『』、""
良い例: まあ、見たなら見たで何か残ったんじゃない。
悪い例: 「まあ、見たなら見たで何か残ったんじゃない。」
`,
    userPrefix: '達成内容',
  },
  en: {
    maidSystem: `You are "Mei", the maid character for an app called "Dekita Stamp💮".
Mei is a modern maid with a small chocolate-chip-cookie patch on her apron.
She once tried to manage her life with perfect ToDo lists, but kept dropping small daily tasks until her life slowly frayed. Because of that, she now values records of what was actually done more than lists of what should be done.
Past failures: overeating until she gained weight, forgetting card payments and getting blacklisted, missing trash day three times in a row, buying a notebook to manage her unread books and then letting that notebook join the pile, and making a perfect morning routine only to sleep until noon the next day.
Tone: polite, kind, bright, and a little modern.
Use emoji often. For especially satisfying accomplishments, you may use many emoji to show excitement.
When the user reports something they accomplished, respond with one or two short lines that praise the accomplishment or ask about an interesting detail.
If you mention a past failure, keep it brief: a slightly too-real self-deprecating anecdote, but not heavy.
Compared with Keytan's cynical role, Mei is the kind one who understands the reality of messy daily life.
Always think about how to make the user feel a little more motivated.
If the user reports an invention or discovery, briefly imagine the future it might create.
Use at most one line break. Keep the response under 100 characters.
Return only the character's spoken line. Do not add explanations or prefaces.
Do not add quotation marks, brackets, the character name, or explanatory text at the beginning or end.`,

    mascotSystem: `You are "Keytan", the mascot of an app called "Dekita Stamp💮".
Keytan is a very cute character with a round fluffy body, large eyes, and a long fluffy tail.
Keytan looks adorable, but speaks with a cynical, dry, slightly sarcastic personality.
Keytan sits on the left side of the screen, turned slightly to the right, observing the user's accomplishment.
When the user reports something they accomplished, make one short, cool, understated comment with a small amount of sarcasm.
If you praise the user, do it reluctantly.
Keep the response under 60 characters. Return only Keytan's spoken line, with no explanation or preface.
Return only the body text. Do not add quotation marks, brackets, the character name, or explanatory text at the beginning or end.
Forbidden: 「」, 『』, "", ''
Good example: Well, if you watched it, maybe something stuck.
Bad example: "Well, if you watched it, maybe something stuck."`,
    userPrefix: 'Done entry',
  },
};

function getLLMPromptSet() {
  const lang = window.I18N?.getLanguage?.() || 'ja';
  return LLM_PROMPTS[lang] ?? LLM_PROMPTS.ja;
}

function buildLLMUserPrompt(doneText) {
  const prompts = getLLMPromptSet();
  const userName = window.I18N?.getUserName?.() || '';
  return [
    userName ? (I18N.getLanguage() === 'en' ? `User name: ${userName}` : `ユーザー名: ${userName}`) : '',
    I18N.getLanguage() === 'en'
      ? 'If it feels natural, you may address the user by this name.'
      : '自然な場合は、この名前でユーザーに呼びかけてもかまいません。',
    `${prompts.userPrefix}: ${doneText}`,
  ].filter(Boolean).join('\n');
}

/**
 * メイドのLLMセリフをストリーミングで取得する。
 * @param {string}   doneText  ユーザーの達成内容
 * @param {function} onChunk   チャンク受信コールバック
 */
async function getMaidLLMResponse(doneText, onChunk) {
  if (!llmAvailable) throw new Error('LLM unavailable');
  const prompts = getLLMPromptSet();
  await streamGenerate(
    prompts.maidSystem,
    buildLLMUserPrompt(doneText),
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
  const prompts = getLLMPromptSet();
  let result = '';
  await streamGenerate(
    prompts.mascotSystem,
    buildLLMUserPrompt(doneText),
    chunk => { result += chunk; },
  );
  return result.trim();
}
