/* =====================================================
   stars.js — 星背景アニメーション
   canvas#starCanvas に描画します。
   COUNT / MAX_RADIUS / COLOR などで見た目を調整できます。
   ===================================================== */

(function () {
  const COUNT      = 140;    // 星の数
  const MAX_RADIUS = 1.2;    // 最大半径(px)
  const MIN_RADIUS = 0.15;   // 最小半径(px)
  const COLOR      = '220,220,220';  // RGB（白銀）
  const ALPHA_MIN  = 0.08;
  const ALPHA_AMP  = 0.30;   // 明滅の振れ幅（控えめに）

  const canvas = document.getElementById('starCanvas');
  const ctx    = canvas.getContext('2d');
  const stars  = [];

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < COUNT; i++) {
    stars.push({
      x:     Math.random() * canvas.width,
      y:     Math.random() * canvas.height,
      r:     Math.random() * (MAX_RADIUS - MIN_RADIUS) + MIN_RADIUS,
      speed: Math.random() * 0.4 + 0.1,
      phase: Math.random() * Math.PI * 2,
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = Date.now() / 1000;

    for (const s of stars) {
      const alpha = ALPHA_MIN + ALPHA_AMP * Math.abs(Math.sin(s.phase + t * s.speed));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${COLOR},${alpha})`;
      ctx.fill();
    }

    requestAnimationFrame(draw);
  }

  draw();
})();
