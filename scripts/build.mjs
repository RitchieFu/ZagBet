import { mkdir, writeFile } from "node:fs/promises";

await mkdir("dist", { recursive: true });

const buildManifest = {
  app: "ZagBet",
  games: ["Hilo", "Cross the Road", "Mines"],
  builtAt: new Date().toISOString(),
};

await writeFile("dist/build-manifest.json", `${JSON.stringify(buildManifest, null, 2)}\n`);
