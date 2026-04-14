const TILE_WIDTH = 180;
const MAX_MULTIPLIER = 8.0;

const duckEl = document.getElementById("duck");
const obstacleEl = document.getElementById("obstacle");
const roadLaneEl = document.getElementById("road-lane");
const roadStripEl = roadLaneEl?.parentElement ?? null;
const CAR_SPRITES = [
  "media/black_car.png",
  "media/blue_car.png",
  "media/green_car.png",
  "media/grey_car.png",
  "media/orange_car.png",
  "media/red_car.png",
];

const wagerEl = document.getElementById("wager");
const startBtn = document.getElementById("start");
const jumpBtn = document.getElementById("jump");
const cashoutBtn = document.getElementById("cashout");
const statusEl = document.getElementById("status-text");

const jumpsValueEl = document.getElementById("jumps-value");
const multiplierValueEl = document.getElementById("multiplier-value");
const payoutValueEl = document.getElementById("payout-value");
const riskValueEl = document.getElementById("risk-value");

/** @typedef {"idle" | "running" | "lost" | "cashedOut"} RunState */

/** @type {{state: RunState; wager: number; jumps: number; multiplier: number; payout: number; isAnimating: boolean}} */
const game = {
  state: "idle",
  wager: 0,
  jumps: 0,
  multiplier: 1,
  payout: 0,
  isAnimating: false,
};

function formatUsd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

function getSession() {
  return globalThis.ZagBetSession?.getSession?.() ?? null;
}

function setStatus(message) {
  if (statusEl) statusEl.textContent = message;
}

function hideObstacle() {
  if (!obstacleEl) return;
  obstacleEl.classList.remove("is-dropping");
  obstacleEl.style.transform = "";
  obstacleEl.style.display = "none";
  obstacleEl.removeAttribute("src");
  obstacleEl.alt = "";
}

function showBarrierObstacle() {
  if (!obstacleEl) return;
  obstacleEl.classList.remove("is-dropping");
  obstacleEl.src = "media/barrier.png";
  obstacleEl.alt = "Barrier";
  obstacleEl.style.display = "block";
  obstacleEl.style.width = "70px";
  // Restart animation each safe jump so barrier drops in.
  void obstacleEl.offsetWidth;
  obstacleEl.classList.add("is-dropping");
}

function showCarObstacle() {
  if (!obstacleEl) return;
  obstacleEl.classList.remove("is-dropping");
  const randomIndex = Math.floor(Math.random() * CAR_SPRITES.length);
  obstacleEl.src = CAR_SPRITES[randomIndex];
  obstacleEl.alt = "Car";
  obstacleEl.style.display = "block";
  obstacleEl.style.width = "96px";
  obstacleEl.style.transform = "";
}

function carProbabilityForJump(jumpNumber) {
  const jump = Math.max(1, jumpNumber);
  const value = 0.08 + (jump - 1) * 0.022;
  return Math.min(0.45, value);
}

function multiplierForJumps(jumps) {
  if (jumps <= 0) return 1;
  const value = 1 + jumps * 0.12 + jumps * jumps * 0.02;
  return Math.min(MAX_MULTIPLIER, value);
}

function updateHud() {
  const nextRisk = game.state === "running" ? carProbabilityForJump(game.jumps + 1) : carProbabilityForJump(1);
  if (jumpsValueEl) jumpsValueEl.textContent = String(game.jumps);
  if (multiplierValueEl) multiplierValueEl.textContent = `${game.multiplier.toFixed(2)}x`;
  if (payoutValueEl) payoutValueEl.textContent = formatUsd(game.payout);
  if (riskValueEl) riskValueEl.textContent = `${Math.round(nextRisk * 100)}%`;
}

function updateControlState() {
  const hasSession = !!getSession();
  const running = game.state === "running";
  if (wagerEl) wagerEl.disabled = running;
  if (startBtn) startBtn.disabled = !hasSession || running;
  if (jumpBtn) jumpBtn.disabled = !running || game.isAnimating;
  if (cashoutBtn) cashoutBtn.disabled = !running || game.jumps <= 0 || game.isAnimating;
}

function createRoadTile() {
  const tile = document.createElement("img");
  tile.className = "road-tile";
  tile.src = "media/road.png";
  tile.alt = "";
  tile.setAttribute("aria-hidden", "true");
  return tile;
}

function ensureRoadTiles() {
  if (!roadLaneEl || !roadStripEl) return;
  const trackWidth = roadStripEl.clientWidth;
  const required = Math.ceil(trackWidth / TILE_WIDTH) + 2;

  while (roadLaneEl.children.length < required) {
    roadLaneEl.appendChild(createRoadTile());
  }
  while (roadLaneEl.children.length > required) {
    roadLaneEl.removeChild(roadLaneEl.lastElementChild);
  }
}

function animateDuckJump() {
  if (!duckEl) return;
  duckEl.style.transform = "translateY(-28px)";
  setTimeout(() => {
    duckEl.style.transform = "translateY(0)";
  }, 170);
}

function shiftRoad() {
  if (!roadLaneEl) return Promise.resolve();
  return new Promise((resolve) => {
    game.isAnimating = true;
    updateControlState();

    roadLaneEl.style.transition = "transform 220ms linear";
    roadLaneEl.style.transform = `translateX(-${TILE_WIDTH}px)`;

    window.setTimeout(() => {
      roadLaneEl.style.transition = "none";
      roadLaneEl.style.transform = "translateX(0)";
      if (roadLaneEl.firstElementChild) {
        roadLaneEl.removeChild(roadLaneEl.firstElementChild);
      }
      roadLaneEl.appendChild(createRoadTile());
      game.isAnimating = false;
      updateControlState();
      resolve();
    }, 235);
  });
}

function resetRoundToIdle() {
  game.state = "idle";
  game.wager = 0;
  game.jumps = 0;
  game.multiplier = 1;
  game.payout = 0;
  game.isAnimating = false;
  updateHud();
  updateControlState();
}

function tryStartRun() {
  const session = getSession();
  if (!session) {
    setStatus("Create a session first to start playing.");
    updateControlState();
    return;
  }

  const wager = Number(wagerEl?.value);
  if (!Number.isFinite(wager) || wager <= 0) {
    setStatus("Wager must be a number greater than 0.");
    return;
  }
  if (wager > session.balance) {
    setStatus("Wager cannot be higher than your session balance.");
    return;
  }

  globalThis.ZagBetSession.setBalance(session.balance - wager);

  game.state = "running";
  game.wager = wager;
  game.jumps = 0;
  game.multiplier = 1;
  game.payout = wager;
  game.isAnimating = false;
  hideObstacle();

  setStatus(`Run started. Wager ${formatUsd(wager)} placed. Jump to continue.`);
  updateHud();
  updateControlState();
}

async function handleJump() {
  if (game.state !== "running" || game.isAnimating) return;

  const nextJump = game.jumps + 1;
  const carProbability = carProbabilityForJump(nextJump);
  const roll = Math.random();
  const isCar = roll < carProbability;

  animateDuckJump();
  await shiftRoad();

  if (isCar) {
    showCarObstacle();
    game.state = "lost";
    game.payout = 0;
    setStatus(`Car hit on jump ${nextJump}. Run over, wager lost.`);
    updateHud();
    updateControlState();
    return;
  }

  showBarrierObstacle();
  game.jumps = nextJump;
  game.multiplier = multiplierForJumps(game.jumps);
  game.payout = game.wager * game.multiplier;

  setStatus(
    `Barrier cleared. Jump ${game.jumps} safe. Cash out now for ${formatUsd(game.payout)} or keep jumping.`,
  );
  updateHud();
  updateControlState();
}

function handleCashout() {
  if (game.state !== "running" || game.jumps <= 0) return;
  const payout = Math.round(game.payout);
  globalThis.ZagBetSession.addBalance(payout);
  game.state = "cashedOut";
  setStatus(`Cashed out ${formatUsd(payout)} at ${game.multiplier.toFixed(2)}x. Start a new run anytime.`);
  updateControlState();
}

function initializeGame() {
  ensureRoadTiles();
  hideObstacle();
  updateHud();
  updateControlState();
  setStatus("Enter a wager and press Start.");
}

startBtn?.addEventListener("click", tryStartRun);
jumpBtn?.addEventListener("click", () => {
  void handleJump();
});
cashoutBtn?.addEventListener("click", handleCashout);
window.addEventListener("resize", ensureRoadTiles);

initializeGame();
