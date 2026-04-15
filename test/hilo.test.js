import test from "node:test";
import assert from "node:assert/strict";
import { games, getGameById, resolveHiLoRound } from "../src/index.js";
import { buildExitWarningMessage, calculateCumulativeMultiplier, calculateStepMultiplier, calculateWinProbability, getCardLabel, HOUSE_EDGE_FACTOR, shouldBlockExitUntilCashout, shouldConfirmExit } from "../src/games/hilo.js";

test("HiLo game stays in the catalog as the active baseline", () => {
  const hilo = getGameById("hilo");

  assert.equal(games.length, 3);
  assert.equal(hilo?.status, "active");
  assert.equal(hilo?.entrypoint, "src/games/hilo.js");
});

test("resolveHiLoRound returns win, lose, or push", () => {
  assert.deepEqual(resolveHiLoRound(7, 10, "higher"), {
    result: "win",
    outcome: "higher",
    currentCard: 7,
    nextCard: 10,
    guess: "higher",
  });

  assert.deepEqual(resolveHiLoRound(7, 4, "higher"), {
    result: "lose",
    outcome: "lower",
    currentCard: 7,
    nextCard: 4,
    guess: "higher",
  });

  assert.deepEqual(resolveHiLoRound(7, 7, "lower"), {
    result: "push",
    outcome: "equal",
    currentCard: 7,
    nextCard: 7,
    guess: "lower",
  });
});

test("getCardLabel formats face cards", () => {
  assert.equal(getCardLabel(1), "Ace");
  assert.equal(getCardLabel(2), "2");
  assert.equal(getCardLabel(10), "10");
  assert.equal(getCardLabel(11), "Jack");
  assert.equal(getCardLabel(12), "Queen");
  assert.equal(getCardLabel(13), "King");
});

test("getCardLabel rejects invalid card values", () => {
  assert.throws(() => getCardLabel(0), RangeError);
  assert.throws(() => getCardLabel(14), RangeError);
  assert.throws(() => getCardLabel(2.5), RangeError);
  assert.throws(() => getCardLabel("ace"), RangeError);
});

test("calculateWinProbability returns the correct chance from the remaining deck", () => {
  const deckWithoutSeven = Array.from({ length: 13 }, (_, index) => index + 1).filter((card) => card !== 7);
  const deckWithoutAce = Array.from({ length: 13 }, (_, index) => index + 1).filter((card) => card !== 1);
  const deckWithoutKing = Array.from({ length: 13 }, (_, index) => index + 1).filter((card) => card !== 13);

  assert.equal(calculateWinProbability(7, "higher", deckWithoutSeven), 6 / 12);
  assert.equal(calculateWinProbability(7, "lower", deckWithoutSeven), 6 / 12);
  assert.equal(calculateWinProbability(1, "lower", deckWithoutAce), 0);
  assert.equal(calculateWinProbability(13, "higher", deckWithoutKing), 0);
});

test("calculateStepMultiplier uses true probability and house edge", () => {
  const deckWithoutSeven = Array.from({ length: 13 }, (_, index) => index + 1).filter((card) => card !== 7);

  assert.ok(Math.abs(calculateStepMultiplier(7, "higher", deckWithoutSeven) - ((12 / 6) * HOUSE_EDGE_FACTOR)) < 1e-12);
  assert.ok(Math.abs(calculateStepMultiplier(7, "lower", deckWithoutSeven) - ((12 / 6) * HOUSE_EDGE_FACTOR)) < 1e-12);
  assert.equal(calculateStepMultiplier(13, "higher", Array.from({ length: 13 }, (_, index) => index + 1).filter((card) => card !== 13)), 0);
  assert.equal(calculateStepMultiplier(1, "lower", Array.from({ length: 13 }, (_, index) => index + 1).filter((card) => card !== 1)), 0);
});

test("calculateCumulativeMultiplier compounds step multipliers", () => {
  const steps = [
    { stepMultiplier: 1.94 },
    { stepMultiplier: 1.62 },
    { stepMultiplier: 1.21 },
  ];

  assert.ok(Math.abs(calculateCumulativeMultiplier(steps) - (1.94 * 1.62 * 1.21)) < 1e-12);
  assert.ok(Math.abs(calculateCumulativeMultiplier([{ stepMultiplier: 0 }, { stepMultiplier: 1.5 }]) - 1.5) < 1e-12);
});

test("simulated RTP converges to the configured house edge factor", () => {
  let seed = 123456789;

  function random() {
    seed = (1664525 * seed + 1013904223) % 4294967296;
    return seed / 4294967296;
  }

  const rounds = 100000;
  let payoutRatioTotal = 0;

  for (let round = 0; round < rounds; round++) {
    const currentCard = Math.floor(random() * 13) + 1;
    const remainingDeck = Array.from({ length: 13 }, (_, index) => index + 1).filter((card) => card !== currentCard);
    const guess = currentCard === 1 ? "higher" : currentCard === 13 ? "lower" : (random() < 0.5 ? "higher" : "lower");
    const winProbability = calculateWinProbability(currentCard, guess, remainingDeck);
    const win = random() < winProbability;
    const stepMultiplier = calculateStepMultiplier(currentCard, guess, remainingDeck);
    const payoutRatio = stepMultiplier === 0 ? 1 : stepMultiplier;
    payoutRatioTotal += win ? payoutRatio : 0;
  }

  const averagePayoutRatio = payoutRatioTotal / rounds;
  const expectedWithEdgeRule = ((11 / 13) * HOUSE_EDGE_FACTOR) + ((2 / 13) * 1);
  assert.ok(Math.abs(averagePayoutRatio - expectedWithEdgeRule) < 0.01);
});

test("buildExitWarningMessage includes the current bet amount", () => {
  assert.equal(
    buildExitWarningMessage(250),
    "Are you sure? You will lose your bet of $250.",
  );
});

test("shouldConfirmExit only warns during an active round", () => {
  assert.equal(shouldConfirmExit({ currentBet: 250, gameActive: true }), true);
  assert.equal(shouldConfirmExit({ currentBet: 250, gameActive: false }), false);
  assert.equal(shouldConfirmExit({ currentBet: 0, gameActive: true }), false);
});

test("shouldBlockExitUntilCashout blocks exit when winnings are pending", () => {
  assert.equal(shouldBlockExitUntilCashout({ currentWinnings: 125 }), true);
  assert.equal(shouldBlockExitUntilCashout({ currentWinnings: 0 }), false);
  assert.equal(shouldBlockExitUntilCashout({ currentWinnings: null }), false);
});

test("resolveHiLoRound rejects invalid card types before evaluating the round", () => {
  assert.throws(() => resolveHiLoRound("7", 10, "higher"), TypeError);
  assert.throws(() => resolveHiLoRound(7, "10", "higher"), TypeError);
});

test("resolveHiLoRound rejects card values outside the deck range", () => {
  assert.throws(() => resolveHiLoRound(0, 10, "higher"), RangeError);
  assert.throws(() => resolveHiLoRound(7, 14, "higher"), RangeError);
});

test("resolveHiLoRound rejects invalid input", () => {
  assert.throws(() => resolveHiLoRound(7, 10, "up"), TypeError);
  assert.throws(() => resolveHiLoRound(7, 10, "higherish"), TypeError);
});
