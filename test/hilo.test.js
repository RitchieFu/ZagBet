import test from "node:test";
import assert from "node:assert/strict";
import { games, getGameById, resolveHiLoRound } from "../src/index.js";
import { getCardLabel } from "../src/games/hilo.js";

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
