/**
 * HiLo game UI for browser play.
 */
import { resolveHiLoRound, getCardLabel } from "./games/hilo.js";

const currentCardEl = document.getElementById("current-card");
const nextCardEl = document.getElementById("next-card");
const btnHigherEl = document.getElementById("btn-higher");
const btnLowerEl = document.getElementById("btn-lower");
const btnNextEl = document.getElementById("btn-next");
const resultMessageEl = document.getElementById("result-message");
const roundInfoEl = document.getElementById("round-info");
const streakInfoEl = document.getElementById("streak-info");
const guessButtonsEl = document.getElementById("guess-buttons");

let gameState = {
  currentCard: null,
  nextCard: null,
  roundNumber: 1,
  streak: 0,
  gameActive: true,
};

/** Generate a random card value from 1 to 13 */
function drawCard() {
  return Math.floor(Math.random() * 13) + 1;
}

/** Update the display */
function updateDisplay() {
  if (gameState.currentCard !== null) {
    currentCardEl.textContent = getCardLabel(gameState.currentCard);
  }
  
  if (gameState.nextCard !== null && !gameState.gameActive) {
    nextCardEl.textContent = getCardLabel(gameState.nextCard);
  }
  
  roundInfoEl.textContent = `Round ${gameState.roundNumber}`;
  streakInfoEl.textContent = gameState.streak > 0 ? `Streak: ${gameState.streak}` : "";
}

/** Start a new round */
function startRound() {
  gameState.currentCard = drawCard();
  gameState.nextCard = drawCard();
  gameState.gameActive = true;
  resultMessageEl.textContent = "";
  resultMessageEl.className = "";
  
  nextCardEl.textContent = "?";
  btnHigherEl.disabled = false;
  btnLowerEl.disabled = false;
  btnNextEl.classList.add("hidden");
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
  
  // Show result
  if (result.result === "win") {
    gameState.streak++;
    resultMessageEl.textContent = "✓ Correct!";
    resultMessageEl.className = "win";
  } else if (result.result === "lose") {
    gameState.streak = 0;
    resultMessageEl.textContent = "✗ Wrong!";
    resultMessageEl.className = "lose";
  } else if (result.result === "push") {
    resultMessageEl.textContent = "= Equal!";
    resultMessageEl.className = "push";
  }
  
  updateDisplay();
  
  // Disable guess buttons and show next button
  btnHigherEl.disabled = true;
  btnLowerEl.disabled = true;
  btnNextEl.classList.remove("hidden");
}

/** Move to next round */
function nextRound() {
  gameState.roundNumber++;
  gameState.currentCard = gameState.nextCard;
  gameState.nextCard = drawCard();
  gameState.gameActive = true;
  
  resultMessageEl.textContent = "";
  resultMessageEl.className = "";
  nextCardEl.textContent = "?";
  
  btnHigherEl.disabled = false;
  btnLowerEl.disabled = false;
  btnNextEl.classList.add("hidden");
  guessButtonsEl.style.opacity = "1";
  
  updateDisplay();
}

// Event listeners
btnHigherEl.addEventListener("click", () => handleGuess("higher"));
btnLowerEl.addEventListener("click", () => handleGuess("lower"));
btnNextEl.addEventListener("click", nextRound);

// Initialize
startRound();
