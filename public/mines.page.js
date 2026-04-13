const GRID_SIZE = 5;
const GRID_CELLS = GRID_SIZE * GRID_SIZE;
const MIN_MINES = 1;
const MAX_MINES = 20;
const DEFAULT_MINES = 3;
const MIN_BET = 1;

/** Share of fair odds returned to the player (1 = no house edge). */
const HOUSE_EDGE = 0.95;

/**
 * Calculates nCr (n choose r) efficiently.
 */
function combinations(n, r) {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  if (r > n / 2) r = n - r;

  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return res;
}

/**
 * Fair multiplier for one random safe reveal: C(n,m) / C(n-1,m) = n / (n - m).
 * Scaled by HOUSE_EDGE.
 */
function payoutMultiplier(numMines) {
  const denom = combinations(GRID_CELLS - 1, numMines);
  if (denom <= 0) return 0;
  return HOUSE_EDGE * (combinations(GRID_CELLS, numMines) / denom);
}

function formatMultiplierDisplay(value) {
  if (!Number.isFinite(value) || value <= 0) return "×—";
  const s = value.toFixed(4).replace(/\.?0+$/, "");
  return `×${s}`;
}

function syncMultiplierDisplay(select, el) {
  const m = Number.parseInt(select.value, 10);
  const mult = Number.isFinite(m) ? payoutMultiplier(m) : NaN;
  el.textContent = formatMultiplierDisplay(mult);
}

function initMinesLayout() {
  const select = document.getElementById("mine-count");
  const grid = document.querySelector(".mines-grid");
  const multEl = document.getElementById("mines-multiplier");

  for (let n = MIN_MINES; n <= MAX_MINES; n++) {
    const opt = document.createElement("option");
    opt.value = String(n);
    opt.textContent = String(n);
    if (n === DEFAULT_MINES) opt.selected = true;
    select.appendChild(opt);
  }

  const totalCells = GRID_CELLS;
  for (let i = 0; i < totalCells; i++) {
    const cell = document.createElement("div");
    cell.className = "mines-cell";
    cell.setAttribute("role", "gridcell");
    grid.appendChild(cell);
  }

  if (multEl) {
    syncMultiplierDisplay(select, multEl);
    select.addEventListener("change", () => syncMultiplierDisplay(select, multEl));
  }
}

/** @returns {number} amount in dollars, 2 decimal places */
function normalizeBetInput(input) {
  const raw = input.value.trim();
  let v = Number.parseFloat(raw);
  if (!Number.isFinite(v) || v < MIN_BET) v = MIN_BET;
  else v = Math.round(v * 100) / 100;
  input.value = v.toFixed(2);
  return v;
}

function setMinesBetError(el, message) {
  if (!el) return;
  if (message) {
    el.textContent = message;
    el.hidden = false;
  } else {
    el.textContent = "";
    el.hidden = true;
  }
}

function initBetAmountField() {
  const bet = document.getElementById("bet-amount");
  if (!bet) return;

  bet.addEventListener("input", () => {
    const v = bet.valueAsNumber;
    if (Number.isFinite(v) && v < 0) bet.value = MIN_BET.toFixed(2);
  });

  bet.addEventListener("blur", () => {
    normalizeBetInput(bet);
  });
}

function initMinesBetButton() {
  const btn = document.getElementById("mines-bet-button");
  const bet = document.getElementById("bet-amount");
  const err = document.getElementById("mines-bet-error");
  if (!btn || !bet) return;

  const clearError = () => setMinesBetError(err, "");

  bet.addEventListener("input", clearError);
  bet.addEventListener("focus", clearError);

  btn.addEventListener("click", () => {
    clearError();
    const amount = normalizeBetInput(bet);

    const session = globalThis.ZagBetSession?.getSession();
    if (!session) {
      setMinesBetError(err, "Start a session before placing a bet.");
      return;
    }

    const betCents = Math.round(amount * 100);
    const balCents = Math.round(session.balance * 100);
    if (betCents > balCents) {
      setMinesBetError(err, "Your bet cannot be more than your balance.");
      return;
    }

    // Bet amount is valid; game logic can run here later.
  });
}

initMinesLayout();
initBetAmountField();
initMinesBetButton();
