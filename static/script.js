
// script.js 

const today = new Date().toISOString().split("T")[0];

function calculatePuzzleNumber() {
  const startDate = new Date("2025-05-07");
  const todayDate = new Date();
  const diffTime = todayDate - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1; // Puzzle #1 on May 7, 2025
}

const puzzleNumber = calculatePuzzleNumber();
document.getElementById("puzzle-number").innerText = puzzleNumber;

let guesses = [];
let hintsUsed = 0;
let answer = "";
let allRankings = {};
let currentRanking = {};
let allClueWords = [];
let visibleClueCount = 3;

const formattedDate = new Date().toLocaleDateString("en-US", {
  weekday: "short",
  year: "numeric",
  month: "long",
  day: "numeric",
});
document.getElementById("date").innerText = formattedDate.replace(/^(\w+)\s/, "$1, ");

document.getElementById("clues").innerText = "Loading puzzle...";

fetch("GloVe/all_rankings.json")
  .then((res) => res.json())
  .then((rankingData) => {
    allRankings = rankingData;
    const keys = Object.keys(allRankings);
    if (puzzleNumber <= keys.length) {
      answer = keys[puzzleNumber - 1];
      currentRanking = allRankings[answer];
      allClueWords = Object.entries(currentRanking)
        .sort((a, b) => a[1] - b[1])
        .map(([word]) => word)
        .filter(word => word !== answer && !word.startsWith(answer) && !answer.startsWith(word));
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
  for (let i = 0; i < visibleClueCount && i < allClueWords.length; i++) {
    const span = document.createElement("div");
    span.className = "clue";
    span.innerText = allClueWords[i];
    clueContainer.appendChild(span);
  }

  if (visibleClueCount >= allClueWords.length) {
    const hintBtn = document.querySelector("button[onclick='getHint()']");
    if (hintBtn) hintBtn.disabled = true;
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

  if (guesses.includes(guess)) {
    feedback.innerText = "You've already guessed that word.";
    input.parentNode.insertBefore(feedback, input.nextSibling);
    input.focus();
    return;
  }

  if (!(guess in currentRanking) && guess !== answer) {
    feedback.innerText = "Sorry! I don't know that word.";
    input.parentNode.insertBefore(feedback, input.nextSibling);
    input.focus();
    return;
  }

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

  const rank = guess === answer ? 1 : currentRanking[guess];
  const rankDisplay = rank ? `#${rank}` : "(not ranked)";

  const guessLog = document.getElementById("guesses");
  const entry = document.createElement("div");
  const colorClass = rank <= 499 ? "rank-green" : rank <= 4999 ? "rank-yellow" : "rank-red";
  entry.className = `guess-entry ${colorClass}`;
  entry.innerHTML = `<span class="guess-word">${guess}</span><span class="rank-display">${rankDisplay}</span>`;
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

    const shareBtn = document.createElement("button");
    shareBtn.innerText = "Share Result";
    shareBtn.style.marginTop = "10px";
    shareBtn.style.display = "block";
    shareBtn.style.marginLeft = "auto";
    shareBtn.style.marginRight = "auto";

    const tierCounts = { green: 0, yellow: 0, red: 0, gray: 0 };
    guesses.forEach(word => {
      const r = word === answer ? 1 : currentRanking[word];
      if (!r) {
        tierCounts.gray++;
        return;
      }
      if (r <= 499) tierCounts.green++;
      else if (r <= 4999) tierCounts.yellow++;
      else tierCounts.red++;
    });

    const emojiRows = [
      tierCounts.green ? `🟢 ${tierCounts.green}` : null,
      tierCounts.yellow ? `🟡 ${tierCounts.yellow}` : null,
      tierCounts.red ? `🔴 ${tierCounts.red}` : null,
    ].filter(Boolean).join("\n");

    const summary = `I played Converge #${puzzleNumber} and solved it in ${guesses.length} guess${guesses.length !== 1 ? 'es' : ''}, using ${hintsUsed} hint${hintsUsed !== 1 ? 's' : ''}.\n\n${emojiRows}`;

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
  if (visibleClueCount < allClueWords.length) {
    visibleClueCount++;
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