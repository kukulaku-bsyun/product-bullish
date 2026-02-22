/* =====================================================
   동물상 테스트 · main.js
   ===================================================== */

const MODEL_URL = 'https://teachablemachine.withgoogle.com/models/aWU3xecbS/';

let model = null;
let webcam = null;
let webcamLoop = false;
let lastPrediction = null;

/* ===== 결과 데이터 ===== */
const RESULTS = {
  dog: {
    badge: '🐶 강아지상',
    emoji: '🐶',
    title: '당신은 강아지상!',
    sub: '따뜻하고 친근한 매력의 소유자입니다.\n주변에 활력을 불어넣는 사람이에요!',
    traits: ['친근함 😊', '활발함 ⚡', '충성심 💛', '사교적 🙌', '따뜻함 🔥'],
    desc: '강아지상은 밝고 에너지 넘치는 매력이 특징이에요. 처음 만나는 사람에게도 금방 친해지는 사교성과 주변 사람을 배려하는 따뜻한 성격을 가지고 있습니다. 의리 있고 진심 어린 관계를 소중히 여기며, 함께 있으면 기분이 좋아지는 사람이에요. 팀워크를 중시하고 모두를 아우르는 리더십도 있답니다! 🐾',
    cls: 'dog',
  },
  cat: {
    badge: '🐱 고양이상',
    emoji: '🐱',
    title: '당신은 고양이상!',
    sub: '신비롭고 세련된 도도한 매력의 소유자입니다.\n자신만의 독특한 세계관이 있어요!',
    traits: ['독립적 🌙', '세련됨 ✨', '신비로움 🔮', '예술적 🎨', '자유로움 🦋'],
    desc: '고양이상은 독특하고 신비로운 분위기가 가장 큰 매력이에요. 혼자만의 시간을 소중히 여기고, 자신만의 취향과 세계관이 뚜렷합니다. 처음엔 도도해 보여도 가까워지면 누구보다 깊고 진한 관계를 맺어요. 예술적 감각이 뛰어나고, 직관이 날카롭습니다. 자기 관리 능력이 최고예요! 🐾',
    cls: 'cat',
  },
};

/* ===== 탭 전환 ===== */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick="switchTab('${tab}')"]`).classList.add('active');
  document.getElementById('tab-' + tab).classList.add('active');
  // 로또 탭으로 이동 시 웹캠 정지
  if (tab !== 'animal' && webcamLoop) stopWebcam();
}

/* ===== 화면 전환 ===== */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

/* ===== 테마 ===== */
function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  document.getElementById('theme-toggle').textContent = isDark ? '☀️ 라이트모드' : '🌙 다크모드';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}
(function applyTheme() {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.addEventListener('DOMContentLoaded', () => {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.textContent = '☀️ 라이트모드';
    });
  }
})();

/* ===== 모델 로드 (최초 1회) ===== */
async function loadModel() {
  if (model) return;
  model = await tmImage.load(MODEL_URL + 'model.json', MODEL_URL + 'metadata.json');
}

/* ===== 파일 업로드 ===== */
function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = document.getElementById('preview-img');
    const placeholder = document.getElementById('drop-placeholder');
    img.src = ev.target.result;
    img.classList.remove('hidden');
    placeholder.classList.add('hidden');
    document.getElementById('analyze-btn').disabled = false;
  };
  reader.readAsDataURL(file);
}

// 드래그 앤 드롭
document.addEventListener('DOMContentLoaded', () => {
  const zone = document.getElementById('drop-zone');
  if (!zone) return;
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = document.getElementById('file-input');
      // DataTransfer를 이용해 file input에 파일 주입
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      input.dispatchEvent(new Event('change'));
    }
  });
});

async function analyzeImage() {
  const img = document.getElementById('preview-img');
  if (!img.src) return;

  showScreen('screen-analyzing');
  try {
    await loadModel();
    // 이미지 로드 대기
    const imgEl = new Image();
    imgEl.src = img.src;
    await new Promise(res => { imgEl.complete ? res() : (imgEl.onload = res); });

    const predictions = await model.predict(imgEl);
    showResult(predictions);
  } catch (err) {
    console.error(err);
    alert('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
    showScreen('screen-upload');
  }
}

/* ===== 웹캠 ===== */
async function initWebcam() {
  showScreen('screen-webcam');
  document.getElementById('lock-btn').disabled = true;

  try {
    await loadModel();
    const flip = true;
    webcam = new tmImage.Webcam(400, 400, flip);
    await webcam.setup();
    await webcam.play();

    const container = document.getElementById('webcam-container');
    container.innerHTML = '';
    container.appendChild(webcam.canvas);

    webcamLoop = true;
    document.getElementById('lock-btn').disabled = false;
    requestAnimationFrame(webcamTick);
  } catch (err) {
    console.error(err);
    alert('웹캠을 사용할 수 없습니다. 카메라 권한을 확인해주세요.');
    showScreen('screen-start');
  }
}

async function webcamTick() {
  if (!webcamLoop || !webcam) return;
  webcam.update();
  const predictions = await model.predict(webcam.canvas);
  lastPrediction = predictions;
  updateLiveBars(predictions);
  requestAnimationFrame(webcamTick);
}

function updateLiveBars(predictions) {
  predictions.forEach(p => {
    const pct = Math.round(p.probability * 100);
    const name = p.className.toLowerCase();
    const isDog = name.includes('dog') || name.includes('강아지') || name === predictions[0].className && pct >= 0;
    // 클래스 인덱스 기반으로 처리
    const idx = predictions.indexOf(p);
    if (idx === 0) {
      document.getElementById('bar-dog').style.width = pct + '%';
      document.getElementById('pct-dog').textContent = pct + '%';
    } else {
      document.getElementById('bar-cat').style.width = pct + '%';
      document.getElementById('pct-cat').textContent = pct + '%';
    }
  });
}

function stopWebcam() {
  webcamLoop = false;
  if (webcam) { try { webcam.stop(); } catch(e){} webcam = null; }
  showScreen('screen-start');
}

function lockWebcamResult() {
  webcamLoop = false;
  if (webcam) { try { webcam.stop(); } catch(e){} webcam = null; }
  if (lastPrediction) showResult(lastPrediction);
  else { alert('분석 결과가 없습니다. 잠시 후 다시 시도해주세요.'); }
}

/* ===== 결과 표시 ===== */
function showResult(predictions) {
  // 인덱스 0: 강아지, 인덱스 1: 고양이 (Teachable Machine 학습 순서 기준)
  // className으로도 판별
  let dogProb = 0, catProb = 0;
  predictions.forEach(p => {
    const name = p.className.toLowerCase();
    if (name.includes('dog') || name.includes('강아지')) {
      dogProb = p.probability;
    } else {
      catProb = p.probability;
    }
  });

  // className에 dog/cat 키워드가 없으면 인덱스 순서로 fallback
  if (dogProb === 0 && catProb === 0) {
    dogProb = predictions[0].probability;
    catProb = predictions[1] ? predictions[1].probability : 1 - dogProb;
  }

  const isDog = dogProb >= catProb;
  const data = isDog ? RESULTS.dog : RESULTS.cat;
  const winPct = Math.round((isDog ? dogProb : catProb) * 100);
  const losePct = 100 - winPct;

  // 결과 카드 채우기
  const badge = document.getElementById('result-badge');
  badge.textContent = data.badge;
  badge.className = 'result-badge ' + data.cls;

  document.getElementById('result-emoji').textContent = data.emoji;
  document.getElementById('result-title').textContent = data.title;
  document.getElementById('result-sub').textContent = data.sub;

  // 특성 태그
  const traitsEl = document.getElementById('result-traits');
  traitsEl.innerHTML = data.traits.map(t => `<span class="trait-tag">${t}</span>`).join('');
  document.getElementById('result-desc').textContent = data.desc;

  // 퍼센트 바 (딜레이로 애니메이션)
  const dogPct = Math.round(dogProb * 100);
  const catPct = 100 - dogPct;
  document.getElementById('rbar-dog').style.width = '0%';
  document.getElementById('rbar-cat').style.width = '0%';
  document.getElementById('rpct-dog').textContent = dogPct + '%';
  document.getElementById('rpct-cat').textContent = catPct + '%';

  showScreen('screen-result');

  // 바 애니메이션은 약간 지연 후 실행
  setTimeout(() => {
    document.getElementById('rbar-dog').style.width = dogPct + '%';
    document.getElementById('rbar-cat').style.width = catPct + '%';
  }, 100);
}

/* ===== 리셋 ===== */
function resetTest() {
  // 업로드 초기화
  const img = document.getElementById('preview-img');
  img.src = '';
  img.classList.add('hidden');
  document.getElementById('drop-placeholder').classList.remove('hidden');
  document.getElementById('file-input').value = '';
  document.getElementById('analyze-btn').disabled = true;
  lastPrediction = null;
  showScreen('screen-start');
}

/* =====================================================
   로또 번호 추천
   ===================================================== */

function getBallRange(n) {
  if (n <= 10) return 'range-1';
  if (n <= 20) return 'range-11';
  if (n <= 30) return 'range-21';
  if (n <= 40) return 'range-31';
  return 'range-41';
}

function generateGame() {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { main: pool.slice(0, 6).sort((a, b) => a - b), bonus: pool[6] };
}

function createBallEl(number, isBonus = false) {
  const el = document.createElement('span');
  el.className = 'ball ' + getBallRange(number) + (isBonus ? ' bonus' : '');
  el.dataset.final = number;
  el.textContent = '?';
  return el;
}

function animateBall(ball, delay, isBonus) {
  const final = parseInt(ball.dataset.final);
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
      if (isBonus) setTimeout(() => ball.classList.add('ball-bonus-glow'), 180);
    }, 380);
  }, delay);
}

let _generating = false;

function generateAll() {
  if (_generating) return;
  _generating = true;

  const container = document.getElementById('lotto-results');
  container.innerHTML = '';

  const btn = document.querySelector('.generate-btn');
  btn.disabled = true;
  btn.classList.remove('btn-clicked');
  void btn.offsetWidth;
  btn.classList.add('btn-clicked');
  setTimeout(() => btn.classList.remove('btn-clicked'), 400);

  const CARD_STAGGER = 190;
  const BALL_STAGGER = 120;
  const totalDuration = 4 * CARD_STAGGER + 6 * BALL_STAGGER + 380 + 200;
  setTimeout(() => { btn.disabled = false; _generating = false; }, totalDuration);

  for (let i = 0; i < 5; i++) {
    const { main, bonus } = generateGame();
    const cardDelay = i * CARD_STAGGER;

    const card = document.createElement('div');
    card.className = 'lotto-card';
    card.style.animationDelay = `${cardDelay}ms`;
    card.style.animationFillMode = 'both';
    card.style.setProperty('--card-delay', `${cardDelay}ms`);

    const gameDiv = document.createElement('div');
    gameDiv.className = 'card-game';
    gameDiv.innerHTML = `<div class="game-label">GAME</div><div class="game-num">${i + 1}</div>`;

    const divider = document.createElement('div');
    divider.className = 'card-divider';

    const numbersDiv = document.createElement('div');
    numbersDiv.className = 'card-numbers';

    main.forEach((n, bi) => {
      const ball = createBallEl(n, false);
      numbersDiv.appendChild(ball);
      animateBall(ball, cardDelay + bi * BALL_STAGGER, false);
    });

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

/* ===== 제휴 문의 폼 ===== */
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const name    = form.querySelector('#name').value.trim();
    const email   = form.querySelector('#email').value.trim();
    const message = form.querySelector('#message').value.trim();
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name) { alert('이름 또는 회사명을 입력해주세요.'); form.querySelector('#name').focus(); return; }
    if (!email || !emailRe.test(email)) { alert('올바른 이메일 주소를 입력해주세요.'); form.querySelector('#email').focus(); return; }
    if (!message) { alert('문의 내용을 입력해주세요.'); form.querySelector('#message').focus(); return; }

    const btn = form.querySelector('.submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<span>전송 중...</span>';

    try {
      const res = await fetch(form.action, {
        method: 'POST', body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        form.classList.add('hidden');
        document.getElementById('form-success').classList.remove('hidden');
      } else {
        btn.disabled = false;
        btn.innerHTML = '<span class="submit-icon">🚀</span><span>문의 보내기</span>';
        alert('전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } catch {
      btn.disabled = false;
      btn.innerHTML = '<span class="submit-icon">🚀</span><span>문의 보내기</span>';
      alert('네트워크 오류가 발생했습니다. 다시 시도해주세요.');
    }
  });
});
