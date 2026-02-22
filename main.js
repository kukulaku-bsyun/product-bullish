function toggleTheme() {
  const body = document.body;
  const btn = document.getElementById('theme-toggle');
  const isDark = body.classList.toggle('dark');
  btn.textContent = isDark ? '☀️ Light Mode' : '🌙 Dark Mode';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

(function () {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    document.addEventListener('DOMContentLoaded', function () {
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.textContent = '☀️ Light Mode';
    });
  }
})();

function recommendLottoNumbers() {
  const numbers = new Set();
  while (numbers.size < 6) {
    const randomNumber = Math.floor(Math.random() * 45) + 1;
    numbers.add(randomNumber);
  }
  const lottoNumbersDiv = document.getElementById('lotto-numbers');
  lottoNumbersDiv.innerHTML = '';
  // Convert the set to an array and sort it
  const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);
  for (const number of sortedNumbers) {
    const numberSpan = document.createElement('span');
    numberSpan.textContent = number;
    lottoNumbersDiv.appendChild(numberSpan);
  }
}
