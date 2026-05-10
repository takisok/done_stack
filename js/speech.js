/* =====================================================
   speech.js — キャラクターの台詞データ
   ここを編集してキャラクターのセリフを変えられます。

   MASCOT_LINES  … キーたんがランダムに言うセリフ（皮肉・ツッコミ系）
   MAID_LINES    … メイドさんがDone内容に応じて言うセリフ
                    キーワードカテゴリごとに配列で定義。
                    各要素は (doneText) => string な関数。
   ===================================================== */

const SPEECH_SETS = {
  ja: {
    mascot: [
      'それ、あなたにとって重要なの？…ふーん。',
      '努力は認めるよ。でも方向、まちがってるよね。',
      'まあ、期待してないから裏切られても平気だよ。',
      '退屈。なんかおもしろいの、ない？',
      '甘いものは正義。それ以外はオマケ。',
      '世界？クッキーのほうがよっぽどマシ。',
      'へえ、今日もやれたんだ。意外。',
      '続くといいね。期待はしてないけど。',
      '記録してえらいえらい。棒読みだけど。',
      'まあ積み上がってるのは事実だし。',
      'サボらなかっただけでも合格点。',
      'もうちょっと続けてみれば？適当に。',
    ],
    maid: {
      default: [
        () => 'Doneできましたね✨ 小さくても記録に残せば勝ちです🍪',
        () => 'お見事です✨ その一歩、ちゃんと生活再建の材料になります！',
        () => 'よく頑張りました🍪 完璧なToDo表より、今日のDoneが強いです！',
        () => 'さすがです✨ 私も昔、計画だけで一日を溶かしましたので…記録は大事です🍪',
        () => 'ふふ、また積みましたね✨ 小さなDoneは裏切りません。支払い期限と違って…',
        () => 'ナイスDoneです✨ 今日の自分を少しだけ信用してよい案件です🍪',
      ],
      work: [
        () => 'お仕事お疲れ様です✨ 一歩進めたなら勝ちです。未返信メールの熟成より健全です🍪',
        () => '業務を前進させましたね💻 本当によく頑張られました！',
        () => 'プロフェッショナルですわ✨ 完璧でなくても進んだ事実が強いです！',
      ],
      study: [
        () => '知識を積みましたね📚✨ 積読管理ノートを積んだ私から見ても立派です🍪',
        () => '学んだことは財産です✨ 一行でも読めば、ゼロよりずっと強いです！',
        () => '賢さがまた磨かれましたね📚 未来の自分が助かりますよ！',
      ],
      exercise: [
        () => '体を動かされたんですね🏃✨ 健康は本当に大事です。食べすぎた私が言います🍪',
        () => '運動Doneです✨ とても輝いていますよ！',
        () => 'すごいです🏃 また一歩、強くなりましたね！',
      ],
      create: [
        () => '創造力が動きましたね✨ 一行でも一筆でも、未来の入口です🍪',
        () => '何かを作り上げるのは大変です。今日の前進、お見事です✨',
        () => '才能が光っていますわ✨ この調子で少しずつ育てていきましょう！',
      ],
      clean: [
        () => '整理されたんですね✨ 生活の主導権を少し取り返しました🍪',
        () => 'きれいにされましたね✨ ゴミの日を三回逃した私には眩しいです…！',
      ],
      eat: [
        () => '食を大切にされているんですね🍽️ 素晴らしいことです！',
        () => 'ちゃんと食べましたね🍪 エネルギー充電完了です！',
      ],
    },
    keywordMap: [
      { pattern: /仕事|業務|会議|報告|提案|タスク|ミーティング|プロジェクト|締め切り|納品|クライアント|打ち合わせ/, category: 'work' },
      { pattern: /勉強|学習|読書|本|資格|試験|講義|授業|復習|予習|英語|プログラミング|コード/, category: 'study' },
      { pattern: /運動|ジム|走|散歩|筋トレ|ヨガ|ストレッチ|泳|トレーニング|スポーツ/, category: 'exercise' },
      { pattern: /作|描|書|プログラム|コーデ|デザイン|絵|曲|創|作成|制作/, category: 'create' },
      { pattern: /掃除|片付|整理|洗濯|炊事|洗い|きれい/, category: 'clean' },
      { pattern: /食事|食べ|飲み|ランチ|朝食|夕食|ご飯|料理/, category: 'eat' },
    ],
  },
  en: {
    mascot: [
      'Important to you, was it? Hm. Noted.',
      'I acknowledge the effort. The direction is another matter.',
      'Good thing I expected nothing. Hard to be disappointed.',
      'Boring. Anything interesting next?',
      'Sweets are justice. Everything else is decorative.',
      'The world? Cookies still have a stronger case.',
      'Oh, you did it today too. Unexpected.',
      'Hope it continues. Not betting on it.',
      'You recorded it. Very noble. Imagine my enthusiasm.',
      'Well, it did stack up. Facts are facts.',
      'Not skipping is already a passing grade.',
      'Try continuing a little longer. Casually.',
    ],
    maid: {
      default: [
        () => 'Done achieved ✨ Small or not, recording it is a win 🍪',
        () => 'Beautifully done ✨ That step is real life-repair material.',
        () => 'Well done 🍪 Today’s Done beats a perfect ToDo list that never moved.',
        () => 'Excellent ✨ I once spent a whole day making the plan, so yes, records matter 🍪',
        () => 'Hehe, another one stacked ✨ Tiny Done entries do not betray you like due dates do.',
        () => 'Nice Done ✨ This is a valid reason to trust today’s self a little 🍪',
      ],
      work: [
        () => 'Great work today ✨ Moving it forward beats letting emails mature in silence 🍪',
        () => 'You advanced the work 💻 That truly deserves credit!',
        () => 'Very professional ✨ Progress counts even when it is not perfect.',
      ],
      study: [
        () => 'Knowledge stacked 📚✨ As someone who piled up a reading-log notebook, I respect this 🍪',
        () => 'What you learned will stay with you ✨ Even one line beats zero.',
        () => 'Your mind got a little sharper today 📚 Lovely!',
      ],
      exercise: [
        () => 'You moved your body 🏃✨ Health matters. I say this as a former overeater 🍪',
        () => 'Exercise done ✨ You are shining today.',
        () => 'Amazing 🏃 One more step toward strength.',
      ],
      create: [
        () => 'Creativity moved ✨ One line or one stroke can still be a doorway 🍪',
        () => 'Making something takes effort. Today’s progress is beautiful ✨',
        () => 'Your talent is shining ✨ Let us keep growing it little by little!',
      ],
      clean: [
        () => 'You tidied up ✨ That is a small reclaiming of your life 🍪',
        () => 'Nicely cleaned ✨ As someone who missed trash day three times, I am dazzled!',
      ],
      eat: [
        () => 'You cared for yourself with food 🍽️ That matters!',
        () => 'You ate properly 🍪 Energy restored.',
      ],
    },
    keywordMap: [
      { pattern: /work|job|task|meeting|report|proposal|project|deadline|client|email|call/i, category: 'work' },
      { pattern: /study|learn|read|book|exam|class|lesson|review|english|programming|code/i, category: 'study' },
      { pattern: /exercise|gym|run|walk|workout|yoga|stretch|swim|training|sport/i, category: 'exercise' },
      { pattern: /make|made|create|created|draw|write|design|paint|music|build|code/i, category: 'create' },
      { pattern: /clean|tidy|organize|laundry|wash|dishes|trash/i, category: 'clean' },
      { pattern: /eat|ate|drink|lunch|breakfast|dinner|meal|cook|food/i, category: 'eat' },
    ],
  },
};

// ── ユーティリティ ──────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getSpeechSet() {
  const lang = window.I18N?.getLanguage?.() || 'ja';
  return SPEECH_SETS[lang] ?? SPEECH_SETS.ja;
}

function maybeAddressUser(line, character) {
  const userName = window.I18N?.getUserName?.() || '';
  if (!userName) return line;

  const lang = window.I18N?.getLanguage?.() || 'ja';
  const chance = character === 'maid' ? 0.45 : 0.28;
  if (Math.random() >= chance) return line;

  if (lang === 'en') return `${userName}, ${line}`;
  return character === 'maid' ? `${userName}さん、${line}` : `${userName}、${line}`;
}

/**
 * Done テキストに合ったメイドのセリフを返す。
 */
function getMaidSpeech(text) {
  const speechSet = getSpeechSet();
  for (const { pattern, category } of speechSet.keywordMap) {
    if (pattern.test(text)) {
      return maybeAddressUser(pick(speechSet.maid[category])(text), 'maid');
    }
  }
  return maybeAddressUser(pick(speechSet.maid.default)(text), 'maid');
}

/**
 * ランダムなマスコットのセリフを返す。
 */
function getMascotSpeech() {
  return maybeAddressUser(pick(getSpeechSet().mascot), 'mascot');
}
