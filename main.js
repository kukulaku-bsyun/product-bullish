/* ===== 테마 ===== */
function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('theme-toggle');
  const isDark = body.classList.toggle('dark');
  btn.textContent = isDark ? '☀️ 라이트모드' : '🌙 다크모드';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

(function applyTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.addEventListener('DOMContentLoaded', function () {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.textContent = '☀️ 라이트모드';
    });
  }
})();

/* ===== 볼 색상 범위 ===== */
function getBallRange(n) {
  if (n <= 10) return 'range-1';
  if (n <= 20) return 'range-11';
  if (n <= 30) return 'range-21';
  if (n <= 40) return 'range-31';
  return 'range-41';
}

/* ===== 6개 + 보너스 1개 생성 ===== */
function generateGame() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  // Fisher-Yates shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const main = pool.slice(0, 6).sort((a, b) => a - b);
  const bonus = pool[6];
  return { main, bonus };
}

/* ===== 볼 HTML 생성 ===== */
function createBallHTML(number, isBonus = false) {
  const range = getBallRange(number);
  const bonusClass = isBonus ? ' bonus' : '';
  return `<span class="ball ${range}${bonusClass}">${number}</span>`;
}

/* ===== 5게임 전체 생성 ===== */
function generateAll() {
  const container = document.getElementById('results');
  container.innerHTML = '';

  for (let i = 1; i <= 5; i++) {
    const { main, bonus } = generateGame();

    const mainBalls = main.map(n => createBallHTML(n)).join('');
    const bonusBall = createBallHTML(bonus, true);

    const card = document.createElement('div');
    card.className = 'lotto-card';
    card.innerHTML = `
      <div class="card-game">
        <div class="game-label">GAME</div>
        <div class="game-num">${i}</div>
      </div>
      <div class="card-divider"></div>
      <div class="card-numbers">
        ${mainBalls}
        <span class="bonus-sep">+</span>
        ${bonusBall}
      </div>
    `;
    container.appendChild(card);
  }
}
