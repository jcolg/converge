// script.js

const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
let allClues = [];
let visibleClues = 3;
let guesses = [];
let hintsUsed = 0;
let answer = "";

// Load puzzle based on today’s date
fetch("puzzles.json")
  .then((res) => res.json())
  .then((data) => {
    const puzzle = data[today];
    if (puzzle) {
      allClues = puzzle.clues;
      answer = puzzle.answer.toLowerCase();
      renderClues();
    } else {
      document.getElementById("clues").innerText = "No puzzle available for today.";
      disableInputs();
    }
  });

document.getElementById("date").innerText = new Date().toDateString();

// Allow Enter key to submit the guess
const guessInput = document.getElementById("guessInput");
if (guessInput) {
  guessInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitGuess();
    }
  });
}

function renderClues() {
  const clueContainer = document.getElementById("clues");
  clueContainer.innerHTML = "";
  for (let i = 0; i < visibleClues && i < allClues.length; i++) {
    const span = document.createElement("div");
    span.className = "clue";
    span.innerText = allClues[i];
    clueContainer.appendChild(span);
  }

  // Disable hint button if no more clues
  if (visibleClues >= allClues.length) {
    const hintBtn = document.querySelector("button[onclick='getHint()']");
    hintBtn.disabled = true;
    const message = document.createElement("div");
    message.style.marginTop = "10px";
    message.style.color = "#555";
    message.innerText = "No more clues available.";
    document.getElementById("input-area").appendChild(message);
  }
}

function submitGuess() {
  const input = document.getElementById("guessInput");
  const guess = input.value.trim().toLowerCase();
  if (!guess) return;

  guesses.push(guess);
  const guessLog = document.getElementById("guesses");
  const entry = document.createElement("div");
  entry.className = "guess-entry";
  entry.innerText = `${guess} ${guess === answer ? '✅' : '❌'}`;
  guessLog.appendChild(entry);
  input.value = "";

  if (guess === answer) {
    document.getElementById("score-area").innerText = `Solved in ${guesses.length}/10 with ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} ✅`;
    disableInputs();
  } else if (guesses.length >= 10) {
    document.getElementById("score-area").innerText = `Failed after 10 guesses — ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''} ❌\nAnswer was: ${answer}`;
    disableInputs();
  }
}

function getHint() {
  if (visibleClues < allClues.length) {
    visibleClues++;
    hintsUsed++;
    renderClues();
  }
}

function disableInputs() {
  document.getElementById("guessInput").disabled = true;
  document.querySelector("button[onclick='submitGuess()']").disabled = true;
  document.querySelector("button[onclick='getHint()']").disabled = true;
}

