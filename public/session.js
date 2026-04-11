/**
 * Browser session: sessionStorage + header UI + first-visit name modal.
 */
const ZAGBET_SESSION_STORAGE_KEY = "zagbet.session.v1";
const ZAGBET_DEFAULT_BALANCE = 500;

/** @type {{ playerName: string; balance: number } | null} */
let sessionCache = null;

function formatUsd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function readFromStorage() {
  try {
    const raw = sessionStorage.getItem(ZAGBET_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const playerName =
      typeof parsed.playerName === "string" ? parsed.playerName.trim() : "";
    const balance = parsed.balance;
    if (!playerName) return null;
    if (typeof balance !== "number" || !Number.isFinite(balance)) return null;
    return { playerName, balance };
  } catch {
    return null;
  }
}

function loadSession() {
  if (sessionCache) return sessionCache;
  sessionCache = readFromStorage();
  return sessionCache;
}

function saveSession(session) {
  sessionCache = {
    playerName: session.playerName,
    balance: session.balance,
  };
  sessionStorage.setItem(
    ZAGBET_SESSION_STORAGE_KEY,
    JSON.stringify(sessionCache),
  );
  updateSessionPanel(sessionCache);
}

function updateSessionPanel(session) {
  const panel = document.getElementById("session-panel");
  const nameEl = document.getElementById("session-player-name");
  const balEl = document.getElementById("session-balance");
  if (!panel || !nameEl || !balEl) return;
  nameEl.textContent = session.playerName;
  balEl.textContent = formatUsd(session.balance);
  panel.hidden = false;
}

function hideSessionPanel() {
  const panel = document.getElementById("session-panel");
  if (panel) panel.hidden = true;
}

function ensureModal() {
  if (document.getElementById("zagbet-session-modal")) return;

  const root = document.createElement("div");
  root.id = "zagbet-session-modal";
  root.className = "zagbet-session-modal";
  root.setAttribute("role", "dialog");
  root.setAttribute("aria-modal", "true");
  root.setAttribute("aria-labelledby", "zagbet-session-title");
  root.innerHTML = `
    <div class="zagbet-session-modal__card">
      <h2 id="zagbet-session-title">Welcome to ZagBet</h2>
      <p>Enter a display name for this session.</p>
      <label class="zagbet-session-modal__label" for="zagbet-session-name">Player name</label>
      <input class="zagbet-session-modal__input" id="zagbet-session-name" type="text" name="playerName" autocomplete="nickname" maxlength="64" />
      <p class="zagbet-session-modal__error" id="zagbet-session-error" aria-live="polite"></p>
      <button type="button" class="zagbet-session-modal__submit" id="zagbet-session-submit">Start session</button>
    </div>
  `;
  root.hidden = true;
  document.body.appendChild(root);

  const input = /** @type {HTMLInputElement} */ (
    document.getElementById("zagbet-session-name")
  );
  const err = document.getElementById("zagbet-session-error");
  const submit = document.getElementById("zagbet-session-submit");

  function showError(msg) {
    if (err) err.textContent = msg;
  }

  function submitName() {
    const name = input?.value?.trim() ?? "";
    if (!name) {
      showError("Please enter a name to continue.");
      input?.focus();
      return;
    }
    showError("");
    saveSession({ playerName: name, balance: ZAGBET_DEFAULT_BALANCE });
    root.hidden = true;
  }

  submit?.addEventListener("click", submitName);
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      submitName();
    }
  });
}

function showModal() {
  const root = document.getElementById("zagbet-session-modal");
  if (!root) return;
  root.hidden = false;
  const input = /** @type {HTMLInputElement | null} */ (
    document.getElementById("zagbet-session-name")
  );
  requestAnimationFrame(() => input?.focus());
}

function initSessionChrome() {
  ensureModal();
  const existing = loadSession();
  if (existing) {
    updateSessionPanel(existing);
    const modal = document.getElementById("zagbet-session-modal");
    if (modal) modal.hidden = true;
  } else {
    hideSessionPanel();
    showModal();
  }
}

globalThis.ZagBetSession = {
  /** @returns {{ playerName: string; balance: number } | null} */
  getSession() {
    const s = loadSession();
    return s ? { ...s } : null;
  },

  /** @param {{ playerName: string; balance: number }} session */
  setSession(session) {
    const name = String(session.playerName ?? "").trim();
    const balance = Number(session.balance);
    if (!name || !Number.isFinite(balance)) return;
    saveSession({ playerName: name, balance });
  },

  /** @param {number} amount */
  setBalance(amount) {
    const s = loadSession();
    if (!s || !Number.isFinite(amount)) return;
    saveSession({ ...s, balance: amount });
  },

  /** @param {number} delta */
  addBalance(delta) {
    const s = loadSession();
    if (!s || !Number.isFinite(delta)) return;
    saveSession({ ...s, balance: s.balance + delta });
  },

  refreshPanel() {
    sessionCache = null;
    const s = loadSession();
    if (s) updateSessionPanel(s);
  },
};

initSessionChrome();
