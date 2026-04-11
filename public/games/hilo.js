const CARD_NAMES = {
  1: "Ace",
  11: "Jack",
  12: "Queen",
  13: "King",
};

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
