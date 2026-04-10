import readline from "readline";
import { resolveHiLoRound, getCardLabel } from "../src/games/hilo.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getRandomCard() {
  return Math.floor(Math.random() * 13) + 1;
}

function formatRound(result) {
  const { currentCard, nextCard, guess, outcome, result: gameResult } = result;
  const current = getCardLabel(currentCard);
  const next = getCardLabel(nextCard);

  console.log(`\nCurrent card: ${current} (${currentCard})`);
  console.log(`Next card: ${next} (${nextCard})`);
  console.log(`You guessed: ${guess}`);
  console.log(`Result: ${outcome.toUpperCase()}`);

  if (gameResult === "win") {
    console.log("🎉 You won this round!");
  } else if (gameResult === "lose") {
    console.log("❌ You lost this round.");
  } else {
    console.log("🔄 Push! Cards were equal.");
  }
}

function promptGuess(currentCard) {
  rl.question(
    '\nGuess higher or lower? (type "higher", "lower", or "quit"): ',
    (input) => {
      if (input.toLowerCase() === "quit") {
        console.log("\nThanks for playing HiLo! Goodbye.\n");
        rl.close();
        return;
      }

      const guess = input.toLowerCase();
      if (guess !== "higher" && guess !== "lower") {
        console.log('Invalid input. Please type "higher" or "lower".');
        promptGuess(currentCard);
        return;
      }

      const nextCard = getRandomCard();
      const roundResult = resolveHiLoRound(currentCard, nextCard, guess);
      formatRound(roundResult);

      console.log("\n--- Next Round ---");
      const nextRound = getRandomCard();
      const label = getCardLabel(nextRound);
      console.log(`Your new card is: ${label} (${nextRound})`);
      promptGuess(nextRound);
    }
  );
}

console.log("🎰 Welcome to HiLo!\n");
console.log("Rules: I show you a card. You guess if the next card will be higher or lower.\n");
console.log("Type 'quit' anytime to exit.\n");

const startCard = getRandomCard();
const label = getCardLabel(startCard);
console.log(`Your starting card is: ${label} (${startCard})\n`);

promptGuess(startCard);
