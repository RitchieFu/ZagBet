import { mkdir, writeFile, copyFile, readdir } from "node:fs/promises";
import { join } from "node:path";

await mkdir("dist", { recursive: true });
await mkdir("public/games", { recursive: true });

const gamesSrc = "src/games";
const files = await readdir(gamesSrc);
for (const name of files) {
  if (name.endsWith(".js")) {
    await copyFile(join(gamesSrc, name), join("public/games", name));
  }
}

const buildManifest = {
  app: "ZagBet",
  games: ["Hilo", "Cross the Road", "Mines"],
  builtAt: new Date().toISOString(),
};

await writeFile("dist/build-manifest.json", `${JSON.stringify(buildManifest, null, 2)}\n`);
