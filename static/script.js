const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
function calculatePuzzleNumber() {
  const startDate = new Date("2025-05-07");
  const todayDate = new Date();
  const diffTime = todayDate - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Puzzle #1 on May 7, 2025
}

const puzzleNumber = calculatePuzzleNumber();
document.getElementById("puzzle-number").innerText = puzzleNumber;
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
      updateGuessStats();
      document.getElementById("guessInput").focus();
    } else {
      document.getElementById("clues").innerText = "No puzzle available for today.";
      disableInputs();
    }
  });

const formattedDate = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  year: "numeric",
  month: "long",
  day: "numeric",
});
document.getElementById("date").innerText = formattedDate.replace(/^(\w+)\s/, "$1, ");

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

function updateGuessStats() {
  const stats = document.getElementById("guess-stats");
  stats.innerText = `Guesses: ${guesses.length} Hints: ${hintsUsed}`;
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
  const feedback = document.getElementById("feedback-message") || document.createElement("div");
  feedback.id = "feedback-message";
  feedback.style.color = "#c00";
  feedback.style.marginBottom = "10px";

  if (!guess) return;

  if (guess.split(" ").length > 1) {
    feedback.innerText = "Sorry! Only one word answers allowed.";
    input.parentNode.insertBefore(feedback, input.nextSibling);
    input.focus();
    return;
  } else {
    feedback.remove();
  }

  guesses.push(guess);
  updateGuessStats();

  const guessLog = document.getElementById("guesses");
  const entry = document.createElement("div");
  entry.className = "guess-entry";
  entry.innerText = `${guess} ${guess === answer ? '✅' : '❌'}`;
  guessLog.prepend(entry);
  input.value = "";
  input.focus();

  if (guess === answer) {
    const congrats = document.createElement("div");
    congrats.id = "congrats-message";
    congrats.style.fontWeight = "bold";
    congrats.style.fontSize = "1.1rem";
    congrats.style.marginTop = "10px";
    congrats.style.marginBottom = "20px";
    congrats.innerText = `🎉 Congrats! You solved puzzle #${puzzleNumber} in ${guesses.length} guess${guesses.length !== 1 ? 'es' : ''}, using ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''}.`;
  
    const summary = `I played Converge #${puzzleNumber} and solved it in ${guesses.length} guess${guesses.length !== 1 ? 'es' : ''}, using ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''}.` ;
    const shareBtn = document.createElement("button");
    shareBtn.innerText = "Share Result";
    shareBtn.style.marginTop = "10px";
    shareBtn.style.display = "block";
    shareBtn.style.marginLeft = "auto";
    shareBtn.style.marginRight = "auto";
    shareBtn.onclick = () => {
      navigator.clipboard.writeText(summary).then(() => {
        shareBtn.innerText = "Copied!";
        setTimeout(() => (shareBtn.innerText = "Share Result"), 2000);
      });
    };
  
    congrats.appendChild(document.createElement("br"));
    congrats.appendChild(shareBtn);
  
    const clues = document.getElementById("clues");
    clues.parentNode.insertBefore(congrats, clues);
  
    disableInputs();
  }  
}

function getHint() {
  if (visibleClues < allClues.length) {
    visibleClues++;
    hintsUsed++;
    renderClues();
    updateGuessStats();
  }
}

function disableInputs() {
  document.getElementById("guessInput").disabled = true;
  document.querySelector("button[onclick='submitGuess()']").disabled = true;
  document.querySelector("button[onclick='getHint()']").disabled = true;
}
