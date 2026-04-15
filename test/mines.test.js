import test from "node:test";
import assert from "node:assert/strict";
import {
  GRID_CELLS,
  HOUSE_EDGE,
  nextStepMultiplier,
  formatMultiplierDisplay,
  pickMineIndices,
  computeTotalWinnings,
} from "../public/mines.page.js";

console.log("--- Mines test suite ---");
test("nextStepMultiplier first reveal (3 mines, none revealed)", () => {
  const numMines = 3;
  const safeRevealed = 0;
  const cellsLeft = GRID_CELLS - safeRevealed;
  const safeLeft = GRID_CELLS - numMines - safeRevealed;
  assert.equal(nextStepMultiplier(numMines, safeRevealed), HOUSE_EDGE * (cellsLeft / safeLeft));
});

test("nextStepMultiplier mid-round (3 mines, 5 safe revealed)", () => {
  const numMines = 3;
  const safeRevealed = 5;
  const cellsLeft = GRID_CELLS - safeRevealed;
  const safeLeft = GRID_CELLS - numMines - safeRevealed;
  assert.equal(nextStepMultiplier(numMines, safeRevealed), HOUSE_EDGE * (cellsLeft / safeLeft));
});

test("nextStepMultiplier returns NaN when no safe cells or no cells left", () => {
  assert.ok(Number.isNaN(nextStepMultiplier(3, GRID_CELLS - 3)));
  assert.ok(Number.isNaN(nextStepMultiplier(3, GRID_CELLS)));
});

test("formatMultiplierDisplay formats positive finite multipliers", () => {
  assert.equal(formatMultiplierDisplay(1.5), "×1.5");
  assert.equal(formatMultiplierDisplay(2), "×2");
  assert.equal(formatMultiplierDisplay(1.23456), "×1.2346");
});

test("formatMultiplierDisplay uses sentinel for non-finite or non-positive", () => {
  assert.equal(formatMultiplierDisplay(NaN), "×—");
  assert.equal(formatMultiplierDisplay(Infinity), "×—");
  assert.equal(formatMultiplierDisplay(-1), "×—");
  assert.equal(formatMultiplierDisplay(0), "×—");
});

test("computeTotalWinnings truncates stake times multiplier toward zero at cents", () => {
  assert.equal(computeTotalWinnings(1, 1.999), 1.99);
  assert.equal(computeTotalWinnings(10.01, 1), 10.01);
});

test("computeTotalWinnings returns 0 when stake times multiplier is not finite", () => {
  assert.equal(computeTotalWinnings(NaN, 1), 0);
  assert.equal(computeTotalWinnings(10, Infinity), 0);
});

test("pickMineIndices returns a set of the requested size for representative counts", () => {
  for (const count of [1, 3, 10, 20]) {
    assert.equal(pickMineIndices(count).size, count);
  }
});

test("pickMineIndices indices are in range and unique", () => {
  const set = pickMineIndices(12);
  assert.equal(set.size, 12);
  for (const i of set) {
    assert.ok(i >= 0 && i < GRID_CELLS && Number.isInteger(i));
  }
});

test("computeTotalWinnings common payout cases", () => {
  assert.equal(computeTotalWinnings(10, 1.05), 10.5);
  assert.equal(computeTotalWinnings(100, 1.235), 123.5);
});
