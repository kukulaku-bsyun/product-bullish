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

/* ===== 볼 요소 생성 (DOM) ===== */
function createBallEl(number, isBonus = false) {
  const el = document.createElement('span');
  el.className = 'ball ' + getBallRange(number) + (isBonus ? ' bonus' : '');
  el.dataset.final = number;
  el.textContent = '?';
  return el;
}

/* ===== 볼 롤링 → 확정 애니메이션 ===== */
function animateBall(ball, delay, isBonus) {
  const final = parseInt(ball.dataset.final);
  const ROLL_DURATION = 380;

  setTimeout(() => {
    ball.classList.add('ball-rolling');
    const interval = setInterval(() => {
      ball.textContent = Math.floor(Math.random() * 45) + 1;
    }, 55);

    setTimeout(() => {
      clearInterval(interval);
      ball.classList.remove('ball-rolling');
      ball.textContent = final;
      ball.classList.add('ball-reveal');
      if (isBonus) {
        setTimeout(() => ball.classList.add('ball-bonus-glow'), 180);
      }
    }, ROLL_DURATION);
  }, delay);
}

/* ===== 5게임 전체 생성 ===== */
function generateAll() {
  const container = document.getElementById('results');
  container.innerHTML = '';

  // 버튼 클릭 애니메이션
  const btn = document.querySelector('.generate-btn');
  btn.classList.remove('btn-clicked');
  void btn.offsetWidth; // reflow로 애니메이션 재시작
  btn.classList.add('btn-clicked');
  setTimeout(() => btn.classList.remove('btn-clicked'), 400);

  const CARD_STAGGER  = 190;  // 카드 간 딜레이 (ms)
  const BALL_STAGGER  = 120;  // 볼 간 딜레이 (ms)

  for (let i = 0; i < 5; i++) {
    const { main, bonus } = generateGame();
    const cardDelay = i * CARD_STAGGER;

    const card = document.createElement('div');
    card.className = 'lotto-card';
    card.style.animationDelay = `${cardDelay}ms`;
    card.style.animationFillMode = 'both';

    const gameDiv = document.createElement('div');
    gameDiv.className = 'card-game';
    gameDiv.innerHTML = `<div class="game-label">GAME</div><div class="game-num">${i + 1}</div>`;

    const divider = document.createElement('div');
    divider.className = 'card-divider';

    const numbersDiv = document.createElement('div');
    numbersDiv.className = 'card-numbers';

    // 메인 볼 6개
    main.forEach((n, bi) => {
      const ball = createBallEl(n, false);
      numbersDiv.appendChild(ball);
      animateBall(ball, cardDelay + bi * BALL_STAGGER, false);
    });

    // 구분자 + 보너스 볼
    const sep = document.createElement('span');
    sep.className = 'bonus-sep';
    sep.textContent = '+';
    numbersDiv.appendChild(sep);

    const bonusBall = createBallEl(bonus, true);
    numbersDiv.appendChild(bonusBall);
    animateBall(bonusBall, cardDelay + 6 * BALL_STAGGER, true);

    card.appendChild(gameDiv);
    card.appendChild(divider);
    card.appendChild(numbersDiv);
    container.appendChild(card);
  }
}
