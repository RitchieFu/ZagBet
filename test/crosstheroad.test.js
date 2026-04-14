import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_MULTIPLIER,
  TILE_WIDTH,
  carProbabilityForJump,
  formatUsd,
  multiplierForJumps,
} from "../public/crosstheroad.page.js";

test("TILE_WIDTH matches road tile layout constant used by the page", () => {
  assert.equal(TILE_WIDTH, 180);
});

test("formatUsd rounds to whole dollars and uses USD currency style", () => {
  assert.equal(formatUsd(0), "$0");
  assert.equal(formatUsd(1), "$1");
  assert.equal(formatUsd(25.4), "$25");
  assert.equal(formatUsd(25.5), "$26");
  assert.equal(formatUsd(999.49), "$999");
  assert.equal(formatUsd(999.5), "$1,000");
});

test("formatUsd handles negative amounts with grouping", () => {
  assert.equal(formatUsd(-12.3), "-$12");
  assert.equal(formatUsd(-1500.6), "-$1,501");
});

test("carProbabilityForJump uses jump 1 baseline when jump number is below 1", () => {
  assert.equal(carProbabilityForJump(0), carProbabilityForJump(1));
  assert.equal(carProbabilityForJump(-5), carProbabilityForJump(1));
});

test("carProbabilityForJump increases roughly linearly before the cap", () => {
  assert.equal(carProbabilityForJump(1), 0.08);
  assert.ok(carProbabilityForJump(2) > carProbabilityForJump(1));
  assert.ok(carProbabilityForJump(10) > carProbabilityForJump(5));
});

test("carProbabilityForJump matches the documented step formula under the cap", () => {
  for (let jump = 1; jump <= 12; jump += 1) {
    const expected = Math.min(0.45, 0.08 + (jump - 1) * 0.022);
    assert.equal(carProbabilityForJump(jump), expected);
  }
});

test("carProbabilityForJump caps at 45%", () => {
  assert.equal(carProbabilityForJump(50), 0.45);
  assert.equal(carProbabilityForJump(1000), 0.45);
});

test("multiplierForJumps returns 1 for non-positive jump counts", () => {
  assert.equal(multiplierForJumps(0), 1);
  assert.equal(multiplierForJumps(-3), 1);
});

test("multiplierForJumps grows with the quadratic payout curve", () => {
  assert.equal(multiplierForJumps(1), 1 + 0.12 + 0.02);
  assert.equal(multiplierForJumps(2), 1 + 2 * 0.12 + 4 * 0.02);
  assert.equal(multiplierForJumps(3), 1 + 3 * 0.12 + 9 * 0.02);
});

test("multiplierForJumps never exceeds MAX_MULTIPLIER", () => {
  let maxSeen = 0;
  for (let jumps = 1; jumps <= 200; jumps += 1) {
    const m = multiplierForJumps(jumps);
    assert.ok(m <= MAX_MULTIPLIER);
    maxSeen = Math.max(maxSeen, m);
  }
  assert.equal(maxSeen, MAX_MULTIPLIER);
});

test("multiplierForJumps is monotonic non-decreasing", () => {
  let prev = multiplierForJumps(0);
  for (let jumps = 1; jumps <= 250; jumps += 1) {
    const next = multiplierForJumps(jumps);
    assert.ok(next >= prev);
    prev = next;
  }
});

test("multiplierForJumps reaches the cap at a finite number of safe jumps", () => {
  const cappedAt = Array.from({ length: 500 }, (_, i) => i + 1).find(
    (jumps) => multiplierForJumps(jumps) === MAX_MULTIPLIER,
  );
  assert.ok(typeof cappedAt === "number" && cappedAt > 1);
  assert.ok(multiplierForJumps(cappedAt - 1) < MAX_MULTIPLIER);
});

test("MAX_MULTIPLIER stays aligned with the in-page payout ceiling", () => {
  assert.equal(MAX_MULTIPLIER, 8);
});
