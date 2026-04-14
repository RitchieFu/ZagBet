import { resolveHiLoRound, calculateWinProbability, calculateStepMultiplier, calculateCumulativeMultiplier, HOUSE_EDGE_FACTOR } from "./games/hilo.js";

export const games = [
  {
    id: "hilo",
    name: "HiLo",
    status: "active",
    description: "Minimal higher/lower round evaluator for CI and future expansion.",
    entrypoint: "src/games/hilo.js",
  },
  {
    id: "cross-the-road",
    name: "Cross the Road",
    status: "active",
    description: "Crossing the road game with random speeding cars",
    entrypoint: "src/games/crosstheroad.js",
  },
  {
    id: "mines",
    name: "Mines",
    status: "planned",
    description: "Reserved for a teammate to implement later.",
    entrypoint: null,
  },
];

export function getGameById(id) {
  return games.find((game) => game.id === id) ?? null;
}

export {
  resolveHiLoRound,
  calculateWinProbability,
  calculateStepMultiplier,
  calculateCumulativeMultiplier,
  HOUSE_EDGE_FACTOR,
};
