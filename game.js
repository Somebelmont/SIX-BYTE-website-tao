const SIZE = 8;
const SHAPES = [
  [[1]],
  [[1,1]], [[1],[1]],
  [[1,1,1]], [[1],[1],[1]],
  [[1,1,1,1]], [[1],[1],[1],[1]],
  [[1,1],[1,1]],
  [[1,1,1],[1,1,1],[1,1,1]],
  [[1,0],[1,1]], [[0,1],[1,1]], [[1,1],[1,0]], [[1,1],[0,1]],
  [[1,0,0],[1,0,0],[1,1,1]],
  [[1,1,1],[0,1,0]],
  [[1,1,0],[0,1,1]], [[0,1,1],[1,1,0]]
];

const boardEl = document.getElementById('board');
const trayEl = document.getElementById('tray');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');
const finalScoreEl = document.getElementById('finalScore');

let grid, pieces, score, best = window.BEST_SCORE || 0;
let cells = [];
let drag = null;

function init() {
  grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
  score = 0;
  overlay.classList.add('hidden');
  buildBoard();
  newPieces();
  updateScore();
  drawBoard();
}

function buildBoard() {
  boardEl.innerHTML = '';
  cells = [];
  for (let i = 0; i < SIZE * SIZE; i++) {
    const c = document.createElement('div');
    c.className = 'cell';
    boardEl.appendChild(c);
    cells.push(c);
  }
}

function newPieces() {
  pieces = [0, 1, 2].map(() => ({
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    used: false
  }));
  drawTray();
}

function drawTray() {
  trayEl.innerHTML = '';
  pieces.forEach((p, i) => {
    const el = document.createElement('div');
    el.className = 'piece' + (p.used ? ' used' : '');
    el.style.gridTemplateColumns = `repeat(${p.shape[0].length}, 22px)`;
    p.shape.forEach(row => row.forEach(v => {
      const c = document.createElement('div');
      c.className = 'pcell' + (v ? ' on' : '');
      el.appendChild(c);
    }));
    el.addEventListener('pointerdown', e => startDrag(e, i));
    trayEl.appendChild(el);
  });
}

function drawBoard() {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      cells[r * SIZE + c].className = 'cell' + (grid[r][c] ? ' filled' : '');
}

function updateScore() {
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function fits(shape, row, col) {
  for (let r = 0; r < shape.length; r++)
    for (let c = 0; c < shape[0].length; c++) {
      if (!shape[r][c]) continue;
      const rr = row + r, cc = col + c;
      if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE || grid[rr][cc]) return false;
    }
  return true;
}

function canPlaceAnywhere(shape) {
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++)
      if (fits(shape, r, c)) return true;
  return false;
}

/* ---------- dragging ---------- */
function cellStep() {
  const a = cells[0].getBoundingClientRect();
  const b = cells[1].getBoundingClientRect();
  return b.left - a.left;
}

function startDrag(e, index) {
  if (pieces[index].used) return;
  e.preventDefault();
  const shape = pieces[index].shape;
  const step = cellStep();

  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.style.gridTemplateColumns = `repeat(${shape[0].length}, ${step - 2}px)`;
  shape.forEach(row => row.forEach(v => {
    const c = document.createElement('div');
    c.className = 'pcell' + (v ? ' on' : '');
    c.style.width = c.style.height = (step - 2) + 'px';
    ghost.appendChild(c);
  }));
  document.body.appendChild(ghost);

  drag = { index, shape, ghost, step, target: null };
  moveDrag(e);
  window.addEventListener('pointermove', moveDrag);
  window.addEventListener('pointerup', endDrag);
}

function moveDrag(e) {
  if (!drag) return;
  const w = drag.ghost.offsetWidth, h = drag.ghost.offsetHeight;
  const left = e.clientX - w / 2;
  const top = e.clientY - h / 2 - 50; // lifted above the finger/cursor
  drag.ghost.style.left = left + 'px';
  drag.ghost.style.top = top + 'px';

  const origin = cells[0].getBoundingClientRect();
  const col = Math.round((left - origin.left) / drag.step);
  const row = Math.round((top - origin.top) / drag.step);

  drawBoard();
  if (fits(drag.shape, row, col)) {
    drag.target = { row, col };
    drag.shape.forEach((rw, r) => rw.forEach((v, c) => {
      if (v) cells[(row + r) * SIZE + (col + c)].classList.add('preview');
    }));
  } else {
    drag.target = null;
  }
}

function endDrag() {
  window.removeEventListener('pointermove', moveDrag);
  window.removeEventListener('pointerup', endDrag);
  if (!drag) return;
  const { index, shape, ghost, target } = drag;
  ghost.remove();
  drag = null;
  if (target) place(index, shape, target.row, target.col);
  else drawBoard();
}

/* ---------- game logic ---------- */
function place(index, shape, row, col) {
  let count = 0;
  shape.forEach((rw, r) => rw.forEach((v, c) => {
    if (v) { grid[row + r][col + c] = 1; count++; }
  }));
  score += count;
  pieces[index].used = true;

  clearLines();
  drawBoard();

  if (pieces.every(p => p.used)) newPieces(); else drawTray();
  updateScore();
  checkGameOver();
}

function clearLines() {
  const fullRows = [], fullCols = [];
  for (let r = 0; r < SIZE; r++) if (grid[r].every(v => v)) fullRows.push(r);
  for (let c = 0; c < SIZE; c++) if (grid.every(row => row[c])) fullCols.push(c);

  const lines = fullRows.length + fullCols.length;
  if (!lines) return;

  fullRows.forEach(r => { for (let c = 0; c < SIZE; c++) grid[r][c] = 0; });
  fullCols.forEach(c => { for (let r = 0; r < SIZE; r++) grid[r][c] = 0; });

  score += lines * 10 * lines; // bonus for clearing several lines at once
}

function checkGameOver() {
  const remaining = pieces.filter(p => !p.used);
  if (remaining.some(p => canPlaceAnywhere(p.shape))) return;

  if (score > best) best = score;
  updateScore();
  finalScoreEl.textContent = score;
  overlay.classList.remove('hidden');
  saveScore(score);
}

function saveScore(s) {
  fetch('api/score.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score: s })
  })
    .then(r => r.json())
    .then(d => { best = d.best; updateScore(); })
    .catch(() => {});
}

document.getElementById('restart').addEventListener('click', init);
document.getElementById('again').addEventListener('click', init);
init();
