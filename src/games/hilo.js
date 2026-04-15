const CARD_NAMES = {
  1: "Ace",
  11: "Jack",
  12: "Queen",
  13: "King",
};

export const HOUSE_EDGE_FACTOR = 0.97;

function countWinningCards(currentCard, guess, remainingDeck) {
  return remainingDeck.filter((card) => {
    if (!Number.isInteger(card) || card < 1 || card > 13) {
      return false;
    }

    if (guess === "higher") {
      return card > currentCard;
    }

    return card < currentCard;
  }).length;
}

export function getCardLabel(value) {
  if (!Number.isInteger(value) || value < 1 || value > 13) {
    throw new RangeError("Card value must be an integer from 1 to 13.");
  }

  return CARD_NAMES[value] ?? String(value);
}

export function resolveHiLoRound(currentCard, nextCard, guess) {
  if (!Number.isInteger(currentCard) || !Number.isInteger(nextCard)) {
    throw new TypeError("Card values must be integers.");
  }

  if (currentCard < 1 || currentCard > 13 || nextCard < 1 || nextCard > 13) {
    throw new RangeError("Card values must be between 1 and 13.");
  }

  if (guess !== "higher" && guess !== "lower") {
    throw new TypeError('Guess must be "higher" or "lower".');
  }

  if (nextCard === currentCard) {
    return {
      result: "push",
      outcome: "equal",
      currentCard,
      nextCard,
      guess,
    };
  }

  const outcome = nextCard > currentCard ? "higher" : "lower";
  return {
    result: outcome === guess ? "win" : "lose",
    outcome,
    currentCard,
    nextCard,
    guess,
  };
}

export function calculateWinProbability(currentCard, guess, remainingDeck) {
  if (!Number.isInteger(currentCard) || currentCard < 1 || currentCard > 13) {
    throw new RangeError("Card value must be an integer from 1 to 13.");
  }

  if (guess !== "higher" && guess !== "lower") {
    throw new TypeError('Guess must be "higher" or "lower".');
  }

  if (!Array.isArray(remainingDeck)) {
    throw new TypeError("Remaining deck must be an array.");
  }

  const totalRemainingCards = remainingDeck.filter(
    (card) => Number.isInteger(card) && card >= 1 && card <= 13,
  ).length;

  if (totalRemainingCards === 0) {
    return 0;
  }

  const winningCards = countWinningCards(currentCard, guess, remainingDeck);
  return winningCards / totalRemainingCards;
}

export function calculateStepMultiplier(currentCard, guess, remainingDeck) {
  if (currentCard === 1 || currentCard === 13) {
    return 0;
  }

  const totalRemainingCards = remainingDeck.filter(
    (card) => Number.isInteger(card) && card >= 1 && card <= 13,
  ).length;
  const winningCards = countWinningCards(currentCard, guess, remainingDeck);

  if (winningCards === 0) {
    return 0;
  }

  return (totalRemainingCards / winningCards) * HOUSE_EDGE_FACTOR;
}

export function calculateCumulativeMultiplier(steps) {
  if (!Array.isArray(steps)) {
    throw new TypeError("Steps must be an array.");
  }

  return steps.reduce((cumulativeMultiplier, step) => {
    const stepMultiplier = Number(step?.stepMultiplier);
    if (!Number.isFinite(stepMultiplier) || stepMultiplier <= 0) {
      return cumulativeMultiplier;
    }

    return cumulativeMultiplier * stepMultiplier;
  }, 1);
}

export function buildExitWarningMessage(currentBet) {
  const betAmount = Number(currentBet);
  const formattedBet = Number.isFinite(betAmount)
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(betAmount)
    : "$0";

  return `Are you sure? You will lose your bet of ${formattedBet}.`;
}

export function shouldConfirmExit(gameState) {
  return Boolean(gameState?.gameActive) && Number(gameState?.currentBet) > 0;
}

export function shouldBlockExitUntilCashout(gameState) {
  return Number(gameState?.currentWinnings) > 0;
}
