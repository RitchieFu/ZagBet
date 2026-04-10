import test from "node:test";
import assert from "node:assert/strict";
import { games, getGameById } from "../src/index.js";

test("game catalog includes all minigames", () => {
  assert.equal(games.length, 3);
  assert.deepEqual(games.map((game) => game.id), ["hilo", "cross-the-road", "mines"]);
});

test("getGameById returns matching game", () => {
  assert.equal(getGameById("mines")?.name, "Mines");
});

test("getGameById returns null for unknown ids", () => {
  assert.equal(getGameById("unknown"), null);
});
