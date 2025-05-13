// script.js (updated for unlimited clues + numeric rank display)

const today = new Date().toISOString().split("T")[0];
function calculatePuzzleNumber() {
  const startDate = new Date("2025-05-07");
  const todayDate = new Date();
  const diffTime = todayDate - startDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays + 1;
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

fetch("puzzle_schedule.json")
  .then(res => res.json())
  .then(schedule => {
    answer = schedule[today];
    if (!answer) throw new Error("No answer found for today");
    return fetch(`rankings_split/${answer}.json`);
  })
  .then(res => res.json())
  .then(data => {
    currentRanking = data;
    allClueWords = Object.entries(currentRanking)
      .sort((a, b) => a[1] - b[1])
      .map(([word]) => word)
      .filter(word => word !== answer && !word.startsWith(answer) && !answer.startsWith(word));
    renderClues();
    updateGuessStats();
    document.getElementById("guessInput").focus();
  })
  .catch(err => {
    document.getElementById("clues").innerText = "No puzzle available for today.";
    disableInputs();
    console.error("Puzzle load error:", err);
  });


const guessInput = document.getElementById("guessInput");
if (guessInput) {
  guessInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitGuess();
    }
  });
}

// Normalize input word (handles plurals)
function normalizeWord(word) {
  // Use pluralize.js to convert plural to singular
  const singular = pluralize.singular(word.toLowerCase());
  return singular;
}

function updateGuessStats() {
  const stats = document.getElementById("guess-stats");
  stats.innerText = `Guesses: ${guesses.length} Hints: ${hintsUsed}`;
}

let revealedClues = []; // Track revealed clues
let clueIndex = 3; // Start revealing clues after the first 3 (we've already displayed ranks 23, 24, 25)

// Function to render the first set of clues from ranks 23, 24, 25
function renderClues() {
  const clueContainer = document.getElementById("clues");
  clueContainer.innerHTML = "";

  // Sort the words by rank and pick the words at ranks 23, 24, 25
  const sortedWords = Object.entries(currentRanking)
    .sort((a, b) => a[1] - b[1]) // Sort by ranking, ascending
    .map(([word, rank]) => ({ word, rank }));

  // Select clues at ranks 23, 24, and 25
  const firstThreeClues = sortedWords.filter(({ rank }) => rank >= 23 && rank <= 25).slice(0, 3);

  // Add the first 3 clues (ranks 23, 24, 25)
  for (let i = 0; i < firstThreeClues.length; i++) {
    const span = document.createElement("div");
    span.className = "clue";
    span.innerText = normalizeWord(firstThreeClues[i].word); // Normalize the clue
    clueContainer.appendChild(span);
    revealedClues.push(firstThreeClues[i].word); // Track revealed clues
  }
}

// Function to reveal the next clue when "Get another clue" is clicked
function getHint() {
  const clueContainer = document.getElementById("clues");

  // Only get a clue if there's a next clue to reveal (after the first 3 clues)
  if (clueIndex < currentRanking.length) {
    // Get the clues from ranks below 23 or above 25
    const sortedWords = Object.entries(currentRanking)
      .sort((a, b) => a[1] - b[1]) // Sort by ranking, ascending
      .map(([word, rank]) => ({ word, rank }));

    // Select clues ranked below 23 or above 25, excluding rank 1
    const nextClue = sortedWords.filter(({ rank }) => (rank !== 1 && (rank < 23 || rank > 25)))[clueIndex - 3]; // Start after the first 3

    if (nextClue) {
      const span = document.createElement("div");
      span.className = "clue";
      span.innerText = normalizeWord(nextClue.word); // Normalize the clue
      clueContainer.appendChild(span);

      // Track the clue
      revealedClues.push(nextClue.word);
      clueIndex++; // Move to the next clue

      // Increment hints used
      hintsUsed++;
      updateGuessStats();  // Update stats to reflect the new hint count
    }
  }
}

// Show the "How to play" section on the first load
const howToPlaySection = document.getElementById("how-to-play");
howToPlaySection.style.display = "block"; // Show instructions

let firstGuessMade = false; // Flag to track if the first guess has been made

// Listen for the first guess to hide the "How to play" section
function submitGuess() {
  const input = document.getElementById("guessInput");
  const guess = normalizeWord(input.value.trim()); // Normalize the guess

  const feedback = document.getElementById("feedback-message") || document.createElement("div");
  feedback.id = "feedback-message";
  feedback.style.color = "#c00";
  feedback.style.marginBottom = "10px";

  if (!guess) return;

  // If it's the first guess, hide the "How to play" section
  if (!firstGuessMade) {
    howToPlaySection.style.display = "none"; // Hide the instructions after the first guess
    firstGuessMade = true; // Set the flag
  }

  if (guesses.includes(guess)) {
    feedback.innerText = "You've already guessed that word.";
    input.parentNode.insertBefore(feedback, input.nextSibling);
    input.focus();
    return;
  }

  // Normalize answer for comparison with guesses
  const normalizedAnswer = normalizeWord(answer);

  // Normalize the currentRanking keys and compare
  const normalizedRanking = Object.keys(currentRanking).reduce((acc, word) => {
    acc[normalizeWord(word)] = currentRanking[word];
    return acc;
  }, {});

  // Check if the guess is either in currentRanking or is the correct answer
  if (!(guess in normalizedRanking) && guess !== normalizedAnswer) {
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

  const rank = guess === normalizedAnswer ? 1 : normalizedRanking[guess];
  const rankDisplay = rank ? `#${rank}` : "(not ranked)";

  const guessLog = document.getElementById("guesses");
  const entry = document.createElement("div");
  const colorClass = rank <= 499 ? "rank-green" : rank <= 4999 ? "rank-yellow" : "rank-red";
  entry.className = `guess-entry ${colorClass}`;
  entry.innerHTML = `<span class="guess-word">${guess}</span><span class="rank-display">${rankDisplay}</span>`;
  guessLog.prepend(entry);
  input.value = "";
  input.focus();

  if (guess === normalizedAnswer) {
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
      const r = word === normalizedAnswer ? 1 : normalizedRanking[word];
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

function toggleHowToPlay() {
  const howToPlaySection = document.getElementById("how-to-play");
  const isCurrentlyVisible = howToPlaySection.style.display === "block";
  
  // Toggle the display of the "How to Play" section
  if (isCurrentlyVisible) {
    howToPlaySection.style.display = "none"; // Hide
  } else {
    howToPlaySection.style.display = "block"; // Show
  }
}

function disableInputs() {
  document.getElementById("guessInput").disabled = true;
  document.querySelector("button[onclick='submitGuess()']").disabled = true;
  document.querySelector("button[onclick='getHint()']").disabled = true;
}
