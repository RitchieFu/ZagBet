/**
 * HiLo game UI for browser play with betting.
 */
import { resolveHiLoRound, getCardLabel } from "./games/hilo.js";

const currentCardEl = document.getElementById("current-card");
const nextCardEl = document.getElementById("next-card");
const dividerEl = document.getElementById("divider");
const btnHigherEl = document.getElementById("btn-higher");
const btnLowerEl = document.getElementById("btn-lower");
const btnNextEl = document.getElementById("btn-next");
const btnCashoutEl = document.getElementById("btn-cashout");
const btnExitEl = document.getElementById("btn-exit");
const resultMessageEl = document.getElementById("result-message");
const roundInfoEl = document.getElementById("round-info");
const streakInfoEl = document.getElementById("streak-info");
const guessButtonsEl = document.getElementById("guess-buttons");

const bettingModalOverlay = document.getElementById("betting-modal-overlay");
const bettingTitleEl = document.getElementById("betting-title");
const betAmountInput = document.getElementById("bet-amount");
const modalBalanceEl = document.getElementById("modal-balance");
const betErrorEl = document.getElementById("bet-error");
const btnPlaceBetEl = document.getElementById("btn-place-bet");
const btnCancelBetEl = document.getElementById("btn-cancel-bet");

const currentBetEl = document.getElementById("current-bet");
const multiplierEl = document.getElementById("multiplier");
const currentWinningsEl = document.getElementById("current-winnings");

function formatUsd(amount) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

let gameState = {
  currentCard: null,
  nextCard: null,
  roundNumber: 1,
  streak: 0,
  gameActive: false,
  currentBet: 0,
  currentWinnings: 0,
  multiplier: 1.0,
  waitingForBet: false,
};

/** Calculate odds for a given card and guess direction */
function calculateOdds(card, guess) {
  if (card < 1 || card > 13) return 0;
  
  let winChance;
  if (guess === "higher") {
    winChance = (13 - card) / 13;
  } else {
    winChance = (card - 1) / 13;
  }
  
  // Payout is 1 / probability, with house edge
  if (winChance === 0) return 0;
  const payout = 1 / winChance * 0.98; // 2% house edge
  return payout;
}

/** Generate a random card value from 1 to 13 */
function drawCard() {
  return Math.floor(Math.random() * 13) + 1;
}
function drawDifferentCard(currentCard) {
  let nextCard = drawCard();
  while (nextCard === currentCard) {
    nextCard = drawCard();
  }
  return nextCard;
}

/** Format multiplier for display */
function formatMultiplier(mult) {
  return mult.toFixed(2) + "x";
}

/** Update the game display */
function updateDisplay() {
  if (gameState.currentCard !== null) {
    currentCardEl.textContent = getCardLabel(gameState.currentCard);
  }
  
  if (gameState.nextCard !== null && !gameState.gameActive) {
    nextCardEl.textContent = getCardLabel(gameState.nextCard);
  }
  
  roundInfoEl.textContent = `Round ${gameState.roundNumber}`;
  streakInfoEl.textContent = gameState.streak > 0 ? `Streak: ${gameState.streak}` : "";
  
  currentBetEl.textContent = formatUsd(gameState.currentBet);
  multiplierEl.textContent = formatMultiplier(gameState.multiplier);
  currentWinningsEl.textContent = formatUsd(gameState.currentWinnings);
}

/** Show the betting modal */
function showBettingModal(isFirstBet = true) {
  gameState.waitingForBet = true;
  betErrorEl.textContent = "";
  betAmountInput.value = "";
  
  const session = globalThis.ZagBetSession?.getSession();
  if (session) {
    modalBalanceEl.textContent = formatUsd(session.balance);
  }
  
  bettingTitleEl.textContent = isFirstBet ? "Place Your Bet" : "Continue Playing - Place Your Bet";
  
  bettingModalOverlay.classList.remove("hidden");
  betAmountInput.focus();
}

/** Hide the betting modal */
function hideBettingModal() {
  bettingModalOverlay.classList.add("hidden");
  gameState.waitingForBet = false;
}

/** Process bet submission */
function handlePlaceBet() {
  const amount = Number(betAmountInput.value);
  const session = globalThis.ZagBetSession?.getSession();
  
  if (!session) {
    betErrorEl.textContent = "Session not found";
    return;
  }
  
  if (!Number.isFinite(amount) || amount < 1) {
    betErrorEl.textContent = "Please enter a valid amount";
    return;
  }
  
  if (amount > session.balance) {
    betErrorEl.textContent = `Insufficient balance. Max: ${formatUsd(session.balance)}`;
    return;
  }
  
  // Deduct bet from balance
  globalThis.ZagBetSession?.setBalance(session.balance - amount);
  globalThis.ZagBetSession?.refreshPanel();
  
  // Set game state
  gameState.currentBet = amount;
  gameState.currentWinnings = 0;
  gameState.multiplier = 1.0;
  gameState.roundNumber = 1;
  gameState.streak = 0;
  
  hideBettingModal();
  startRound();
}

/** Handle bet cancellation (when continuing a session) */
function handleCancelBet() {
  const referrer = document.referrer ? new URL(document.referrer) : null;
  if (referrer && referrer.origin === window.location.origin) {
    window.history.back();
    return;
  }

  window.location.href = "index.html";
}

/** Start a new game round */
function startRound() {
  gameState.currentCard = drawCard();
  gameState.nextCard = drawDifferentCard(gameState.currentCard);
  gameState.gameActive = true;
  resultMessageEl.textContent = "";
  resultMessageEl.className = "";
  
  nextCardEl.textContent = "?";
  dividerEl.classList.add("hidden");
  nextCardEl.classList.add("hidden");
  btnHigherEl.disabled = false;
  btnLowerEl.disabled = false;
  btnNextEl.classList.add("hidden");
  btnCashoutEl.classList.add("hidden");
  guessButtonsEl.style.opacity = "1";
  
  updateDisplay();
}

/** Process a guess */
function handleGuess(guess) {
  if (!gameState.gameActive || gameState.currentCard === null || gameState.nextCard === null) {
    return;
  }
  
  const result = resolveHiLoRound(gameState.currentCard, gameState.nextCard, guess);
  gameState.gameActive = false;
  
  // Update display
  nextCardEl.textContent = getCardLabel(gameState.nextCard);
    dividerEl.classList.remove("hidden");
    nextCardEl.classList.remove("hidden");
  
  // Calculate winnings for this round
  let roundWinnings = 0;
  if (result.result === "win") {
    gameState.streak++;
    const odds = calculateOdds(gameState.currentCard, guess);
    gameState.multiplier = Math.pow(odds, gameState.streak);
    roundWinnings = gameState.currentBet * gameState.multiplier;
    gameState.currentWinnings = roundWinnings;
    resultMessageEl.textContent = "✓ Correct!";
    resultMessageEl.className = "win";
  } else if (result.result === "lose") {
    resultMessageEl.textContent = "✗ Wrong! Game Over.";
    resultMessageEl.className = "lose";
    gameState.streak = 0;
    gameState.multiplier = 0;
    gameState.currentWinnings = 0;
  } else if (result.result === "push") {
     // Auto-draw new cards instead of asking user to retry
     gameState.currentCard = gameState.nextCard;
     gameState.nextCard = drawDifferentCard(gameState.currentCard);
     gameState.gameActive = true;
     resultMessageEl.textContent = "";
     resultMessageEl.className = "";
     nextCardEl.textContent = "?";
     dividerEl.classList.add("hidden");
     nextCardEl.classList.add("hidden");
    
     btnHigherEl.disabled = false;
     btnLowerEl.disabled = false;
     btnNextEl.classList.add("hidden");
     btnCashoutEl.classList.add("hidden");
    
     updateDisplay();
     return;
  }
  
  updateDisplay();
  
  // Disable guess buttons and show next button or end game
  btnHigherEl.disabled = true;
  btnLowerEl.disabled = true;
  
  if (result.result === "win") {
    // Show continue options
    btnNextEl.classList.remove("hidden");
    btnCashoutEl.classList.remove("hidden");
  } else if (result.result === "lose") {
    // Game over - offer to play again
    btnNextEl.textContent = "Play Again";
    btnNextEl.classList.remove("hidden");
  } else if (result.result === "push") {
    // Retry with same cards
    btnNextEl.textContent = "Retry";
    btnNextEl.classList.remove("hidden");
  }
}



/** Cash out current winnings */
function handleCashout() {
  const session = globalThis.ZagBetSession?.getSession();
  if (!session) return;
  
  const totalPayout = session.balance + gameState.currentWinnings;
  globalThis.ZagBetSession?.setBalance(totalPayout);
  globalThis.ZagBetSession?.refreshPanel();
  
  resultMessageEl.textContent = `Cashed out: ${formatUsd(gameState.currentWinnings)}`;
  resultMessageEl.className = "win";
  
  // Reset game state and show bet modal for new game
  gameState.currentBet = 0;
  gameState.currentWinnings = 0;
  gameState.multiplier = 1.0;
  gameState.roundNumber = 1;
  gameState.streak = 0;
  gameState.gameActive = false;
  
  currentCardEl.textContent = "?";
  nextCardEl.textContent = "?";
    dividerEl.classList.add("hidden");
    nextCardEl.classList.add("hidden");
  btnHigherEl.disabled = true;
  btnLowerEl.disabled = true;
  btnNextEl.classList.add("hidden");
  btnCashoutEl.classList.add("hidden");
  
  updateDisplay();
  
  // Show betting modal for new game
  setTimeout(() => showBettingModal(true), 1000);
}

/** Move to next round or end game */
function handleNext() {
  if (gameState.currentBet === 0) return;
  
  if (gameState.multiplier === 0) {
    // Lost - start new game
    showBettingModal(false);
  } else {
    // Continue to next round
    gameState.roundNumber++;
    gameState.currentCard = gameState.nextCard;
    gameState.nextCard = drawDifferentCard(gameState.currentCard);
    gameState.gameActive = true;
    
    resultMessageEl.textContent = "";
    resultMessageEl.className = "";
    nextCardEl.textContent = "?";
    dividerEl.classList.add("hidden");
    nextCardEl.classList.add("hidden");
    
    btnHigherEl.disabled = false;
    btnLowerEl.disabled = false;
    btnNextEl.classList.add("hidden");
    btnCashoutEl.classList.add("hidden");
    
    updateDisplay();
  }
}

// Event listeners
btnHigherEl.addEventListener("click", () => handleGuess("higher"));
btnLowerEl.addEventListener("click", () => handleGuess("lower"));
btnNextEl.addEventListener("click", handleNext);

btnCashoutEl.addEventListener("click", handleCashout);
btnExitEl.addEventListener("click", () => {
  window.location.href = "index.html";
});
btnPlaceBetEl.addEventListener("click", handlePlaceBet);
btnCancelBetEl.addEventListener("click", handleCancelBet);

betAmountInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handlePlaceBet();
  }
});

/** Wait for session to be available before initializing */
function waitForSessionAndInit() {
  if (globalThis.ZagBetSession) {
    updateDisplay();
    showBettingModal(true);
  } else {
    // Retry in 50ms if session not ready yet
    setTimeout(waitForSessionAndInit, 50);
  }
}

// Initialize
waitForSessionAndInit();
