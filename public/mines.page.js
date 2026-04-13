const GRID_SIZE = 5;
const GRID_CELLS = GRID_SIZE * GRID_SIZE;
const MIN_MINES = 1;
const MAX_MINES = 20;
const DEFAULT_MINES = 3;
const MIN_BET = 1;

const MINE_FADE_MS = 300;
const PAUSE_AFTER_MINES_MS = 250;
const SAFE_FADE_MS = 300;
const HOUSE_EDGE = 0.95;

/** All classes a cell can pick up from gameplay; strip these to reset or before repainting. */
const CELL_STATE = [
  "mines-cell--revealed-safe",
  "mines-cell--revealed-mine",
  "mines-cell--fade-mine",
  "mines-cell--fade-mine-visible",
  "mines-cell--fade-safe",
  "mines-cell--fade-safe-visible",
];

const game = {
  phase: /** @type {"idle" | "playing" | "animating"} */ ("idle"),
  mines: /** @type {Set<number> | null} */ (null),
  numMines: 0,
  stake: 0,
  safeRevealed: 0,
  cumulativeMultiplier: 1,
};

function nextStepMultiplier(numMines, safeRevealed) {
  const cellsLeft = GRID_CELLS - safeRevealed;
  const safeLeft = GRID_CELLS - numMines - safeRevealed;
  if (safeLeft <= 0 || cellsLeft <= 0) return NaN;
  return HOUSE_EDGE * (cellsLeft / safeLeft);
}

function formatMultiplierDisplay(value) {
  if (!Number.isFinite(value) || value <= 0) return "×—";
  return `×${value.toFixed(4).replace(/\.?0+$/, "")}`;
}

function pickMineIndices(count) {
  const order = Array.from({ length: GRID_CELLS }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return new Set(order.slice(0, count));
}

function truncateMoney2(amount) {
  return Number.isFinite(amount) ? Math.trunc(amount * 100) / 100 : 0;
}

function normalizeBetInput(input) {
  let v = Number.parseFloat(input.value.trim());
  if (!Number.isFinite(v) || v < MIN_BET) v = MIN_BET;
  else v = Math.round(v * 100) / 100;
  input.value = v.toFixed(2);
  return v;
}

function setMinesBetError(el, message) {
  if (!el) return;
  el.textContent = message || "";
  el.hidden = !message;
}

function cells() {
  return document.querySelectorAll("#mines-grid .mines-cell");
}

function resetCellBoard() {
  cells().forEach((c) => c.classList.remove(...CELL_STATE));
}

/** Full reveal: mines red, rest green (clears fade/revealed classes first). */
function paintBoardFromMines(mineSet) {
  const list = [...cells()];
  for (let i = 0; i < GRID_CELLS; i++) {
    const c = list[i];
    c.classList.remove(...CELL_STATE);
    c.classList.add(
      mineSet.has(i) ? "mines-cell--revealed-mine" : "mines-cell--revealed-safe",
    );
  }
}

function setGridMode(mode) {
  const grid = document.getElementById("mines-grid");
  if (!grid) return;
  grid.classList.toggle("mines-grid--active", mode === "playing");
  grid.classList.toggle("mines-grid--blocked", mode === "idle" || mode === "animating");
}

function updateNextMultiplierDisplay(select, multEl) {
  if (!multEl) return;
  const m = Number.parseInt(select.value, 10);
  const mult =
    game.phase === "playing"
      ? nextStepMultiplier(game.numMines, game.safeRevealed)
      : Number.isFinite(m)
        ? nextStepMultiplier(m, 0)
        : NaN;
  multEl.textContent = formatMultiplierDisplay(mult);
}

function totalWinnings() {
  return truncateMoney2(game.stake * game.cumulativeMultiplier);
}

function resetToIdleUI(ctx, clearBoard) {
  Object.assign(game, {
    phase: "idle",
    mines: null,
    numMines: 0,
    stake: 0,
    safeRevealed: 0,
    cumulativeMultiplier: 1,
  });
  if (clearBoard) resetCellBoard();
  setGridMode("idle");
  ctx.betInput.readOnly = false;
  ctx.betLabel.textContent = "Bet amount:";
  ctx.btn.textContent = "BET";
  ctx.btn.classList.remove("mines-bet-row__btn--cashout");
  ctx.btn.disabled = false;
  ctx.select.disabled = false;
  ctx.betInput.value = ctx.lastBetAmount.toFixed(2);
  updateNextMultiplierDisplay(ctx.select, ctx.multEl);
}

function initMinesLayout() {
  const select = document.getElementById("mine-count");
  const grid = document.getElementById("mines-grid");
  const multEl = document.getElementById("mines-multiplier");

  for (let n = MIN_MINES; n <= MAX_MINES; n++) {
    const opt = document.createElement("option");
    opt.value = opt.textContent = String(n);
    if (n === DEFAULT_MINES) opt.selected = true;
    select.appendChild(opt);
  }

  for (let i = 0; i < GRID_CELLS; i++) {
    const cell = document.createElement("div");
    cell.className = "mines-cell";
    cell.dataset.index = String(i);
    cell.setAttribute("role", "gridcell");
    grid.appendChild(cell);
  }

  select.addEventListener("change", () => {
    if (game.phase === "idle") updateNextMultiplierDisplay(select, multEl);
  });
  updateNextMultiplierDisplay(select, multEl);
  setGridMode("idle");
  return { select, grid, multEl };
}

function nextPaintFrame(fn) {
  requestAnimationFrame(() => requestAnimationFrame(fn));
}

function initMinesGame(refs) {
  const { select, grid, multEl } = refs;
  const betInput = document.getElementById("bet-amount");
  const betLabel = document.getElementById("mines-bet-label");
  const btn = document.getElementById("mines-bet-button");
  const err = document.getElementById("mines-bet-error");
  if (!betInput || !betLabel || !btn || !grid) return;

  let lastBetAmount = MIN_BET;

  const ctx = () => ({
    betInput,
    betLabel,
    btn,
    select,
    multEl,
    lastBetAmount,
  });

  const idle = (clearBoard) => resetToIdleUI(ctx(), clearBoard);
  const clearErr = () => setMinesBetError(err, "");
  const onBetIdle = () => {
    if (game.phase === "idle") clearErr();
  };

  betInput.addEventListener("input", () => {
    onBetIdle();
    if (game.phase === "idle") {
      const v = betInput.valueAsNumber;
      if (Number.isFinite(v) && v < 0) betInput.value = MIN_BET.toFixed(2);
    }
  });
  betInput.addEventListener("focus", onBetIdle);
  betInput.addEventListener("blur", () => {
    if (game.phase === "idle") normalizeBetInput(betInput);
  });

  function creditPayoutAndIdle(mineSet) {
    globalThis.ZagBetSession?.addBalance(totalWinnings());
    paintBoardFromMines(mineSet);
    idle(false);
  }

  function finishLoss() {
    idle(false);
  }

  function runLossRevealSequence() {
    const mineSet = game.mines;
    if (!mineSet) return finishLoss();

    const minesCopy = new Set(mineSet);
    game.phase = "animating";
    setGridMode("animating");
    btn.disabled = true;

    const list = [...cells()];
    for (const i of mineSet) {
      list[i].classList.remove("mines-cell--revealed-mine", "mines-cell--revealed-safe");
      list[i].classList.add("mines-cell--fade-mine");
    }
    nextPaintFrame(() => {
      for (const i of mineSet) list[i].classList.add("mines-cell--fade-mine-visible");
    });

    setTimeout(() => {
      for (let i = 0; i < GRID_CELLS; i++) {
        if (mineSet.has(i)) continue;
        list[i].classList.remove("mines-cell--revealed-safe");
        list[i].classList.add("mines-cell--fade-safe");
      }
      nextPaintFrame(() => {
        for (let i = 0; i < GRID_CELLS; i++) {
          if (!mineSet.has(i)) list[i].classList.add("mines-cell--fade-safe-visible");
        }
      });

      setTimeout(() => {
        paintBoardFromMines(minesCopy);
        btn.disabled = false;
        finishLoss();
      }, SAFE_FADE_MS + 40);
    }, MINE_FADE_MS + PAUSE_AFTER_MINES_MS);
  }

  grid.addEventListener("click", (e) => {
    const cell = e.target.closest(".mines-cell");
    if (!cell || !grid.contains(cell)) return;
    const index = Number.parseInt(cell.dataset.index ?? "", 10);
    if (!Number.isFinite(index) || game.phase !== "playing" || !game.mines) return;
    if (
      cell.classList.contains("mines-cell--revealed-safe") ||
      cell.classList.contains("mines-cell--revealed-mine")
    ) {
      return;
    }

    if (game.mines.has(index)) {
      runLossRevealSequence();
      return;
    }

    const step = nextStepMultiplier(game.numMines, game.safeRevealed);
    if (!Number.isFinite(step) || step <= 0) return;

    game.cumulativeMultiplier *= step;
    game.safeRevealed += 1;
    cell.classList.add("mines-cell--revealed-safe");
    betInput.value = totalWinnings().toFixed(2);
    updateNextMultiplierDisplay(select, multEl);

    if (game.safeRevealed >= GRID_CELLS - game.numMines) {
      creditPayoutAndIdle(new Set(game.mines));
    }
  });

  btn.addEventListener("click", () => {
    clearErr();

    if (game.phase === "playing") {
      creditPayoutAndIdle(new Set(game.mines));
      return;
    }
    if (game.phase === "animating") return;

    const amount = normalizeBetInput(betInput);
    lastBetAmount = amount;

    const session = globalThis.ZagBetSession?.getSession();
    if (!session) {
      setMinesBetError(err, "Start a session before placing a bet.");
      return;
    }
    if (Math.round(amount * 100) > Math.round(session.balance * 100)) {
      setMinesBetError(err, "Your bet cannot be more than your balance.");
      return;
    }

    const m = Number.parseInt(select.value, 10);
    if (!Number.isFinite(m) || m < MIN_MINES || m > MAX_MINES) return;

    globalThis.ZagBetSession?.addBalance(-amount);

    Object.assign(game, {
      phase: "playing",
      mines: pickMineIndices(m),
      numMines: m,
      stake: amount,
      safeRevealed: 0,
      cumulativeMultiplier: 1,
    });
    resetCellBoard();
    setGridMode("playing");
    betInput.readOnly = true;
    betLabel.textContent = "Total winnings:";
    btn.textContent = "Cash Out";
    btn.classList.add("mines-bet-row__btn--cashout");
    select.disabled = true;
    betInput.value = totalWinnings().toFixed(2);
    updateNextMultiplierDisplay(select, multEl);
  });
}

const layoutRefs = initMinesLayout();
initMinesGame(layoutRefs);
