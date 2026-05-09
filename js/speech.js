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
        () => '素晴らしいです！また一つ積み上がりましたね✨',
        () => 'お見事です！その一歩、ちゃんと力になってます！',
        () => 'よく頑張りました！今日の積み上げも立派です！',
        () => 'さすがです！着実に前進されていますよ！',
        () => 'ふふ、またやり遂げましたね。とても素敵です！',
        () => 'どんどん積み上がっていきますね。誇らしいです！',
      ],
      work: [
        () => 'お仕事お疲れ様です！しっかり前に進められましたね！',
        () => '業務を前進させましたね。本当によく頑張られました！',
        () => 'プロフェッショナルですわ！お疲れ様でした！',
      ],
      study: [
        () => '知識は宝です！学びを積み上げられて素晴らしいです！',
        () => '学んだことは一生の財産です。お見事です！',
        () => '賢さがまた磨かれましたね。本当に嬉しいです！',
      ],
      exercise: [
        () => '体を動かされたんですね！健康が一番です！',
        () => '運動されたんですね！とても輝いていますよ！',
        () => 'すごいです！また一歩、強くなりましたね！',
      ],
      create: [
        () => '創造力が溢れていますね！素晴らしいですね！',
        () => '何かを作り上げるのは大変です。お見事です！',
        () => '才能が光っていますわ！この調子で育てていきましょう！',
      ],
      clean: [
        () => '整理されたんですね！清潔な環境は心を整えるのです！',
        () => 'きれいにされましたね！気持ちがいいですね！',
      ],
      eat: [
        () => '食を大切にされているんですね。素晴らしいことです！',
        () => 'ちゃんと食べましたね！エネルギー充電完了！',
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
        () => 'Wonderful! Another small win is on the stack ✨',
        () => 'Beautifully done! That step absolutely counts.',
        () => 'Well done! Today has one more solid achievement.',
        () => 'Excellent work! You are moving forward steadily.',
        () => 'Hehe, you did it again. That is lovely!',
        () => 'The stack keeps growing. I am proud of you!',
      ],
      work: [
        () => 'Great work today! You moved things forward.',
        () => 'You advanced the work. That truly deserves credit!',
        () => 'Very professional. Nicely done!',
      ],
      study: [
        () => 'Knowledge is treasure. Wonderful learning today!',
        () => 'What you learned will stay with you. Well done!',
        () => 'Your mind got a little sharper today. Lovely!',
      ],
      exercise: [
        () => 'You moved your body! Health is precious.',
        () => 'Exercise done! You are shining today.',
        () => 'Amazing! One more step toward strength.',
      ],
      create: [
        () => 'So much creativity! That is wonderful.',
        () => 'Making something takes effort. Beautifully done!',
        () => 'Your talent is shining. Let us keep growing it!',
      ],
      clean: [
        () => 'You tidied up! A clear space helps the heart too.',
        () => 'Nicely cleaned! That must feel refreshing.',
      ],
      eat: [
        () => 'You cared for yourself with food. That matters!',
        () => 'You ate properly! Energy restored.',
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
