import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const INDEX_HTML_PATH = new URL("../public/index.html", import.meta.url);

test("home page links to all game pages", async () => {
  const indexHtml = await readFile(INDEX_HTML_PATH, "utf8");

  assert.match(indexHtml, /href="hilo\.html"/);
  assert.match(indexHtml, /href="crosstheroad\.html"/);
  assert.match(indexHtml, /href="mines\.html"/);
});

test("home page includes all game card titles", async () => {
  const indexHtml = await readFile(INDEX_HTML_PATH, "utf8");

  assert.match(indexHtml, />HiLo</);
  assert.match(indexHtml, />Cross The Road</);
  assert.match(indexHtml, />Mines</);
});
