// Retrieve data from localStorage on page load
let guesses = JSON.parse(localStorage.getItem('guesses')) || []; // Default to empty array if no data
let hintsUsed = parseInt(localStorage.getItem('hintsUsed')) || 0; // Default to 0 if no data
let revealedClues = []; // Store revealed clues (hints used)
let lastPuzzleDate = localStorage.getItem('lastPuzzleDate'); // Last date the puzzle was played
let isPuzzleSolved = localStorage.getItem('isPuzzleSolved') === "true";  // Puzzle solved status
let answer = "";
let currentRanking = {};
let allRankings = {};
let allClueWords = [];
let visibleClueCount = 3;

// Initialize Day.js with UTC and timezone plugins
dayjs.extend(dayjs_plugin_utc);
dayjs.extend(dayjs_plugin_timezone);

// Get the current date and time in the user's local timezone using Day.js
const today = dayjs().tz(dayjs.tz.guess()).startOf('day'); // Get today's date at midnight in local time

if (lastPuzzleDate !== today.format("YYYY-MM-DD")) {
  console.log("New day detected. Resetting data...");
  localStorage.removeItem('guesses');
  localStorage.removeItem('hintsUsed');
  localStorage.removeItem('revealedClues');
  localStorage.removeItem('isPuzzleSolved');

  revealedClues = [];  
  console.log("Revealed clues after reset: ", revealedClues);

  localStorage.setItem('lastPuzzleDate', today.format("YYYY-MM-DD"));
  localStorage.setItem('isPuzzleSolved', 'false');

  guesses = [];
  hintsUsed = 0;
  localStorage.setItem('guesses', JSON.stringify(guesses));
  localStorage.setItem('hintsUsed', hintsUsed);
} else {
  revealedClues = JSON.parse(localStorage.getItem('revealedClues')) || [];
}

isPuzzleSolved = false;

// Function to calculate the puzzle number based on the difference from the start date
function calculatePuzzleNumber() {
  const startDate = dayjs.tz("2025-05-07T00:00:00", dayjs.tz.guess()).startOf('day');
  const diffDays = today.diff(startDate, 'day');
  return diffDays + 1;
}

const puzzleNumber = calculatePuzzleNumber();
document.getElementById("puzzle-number").innerText = puzzleNumber;

// Display today's date in a readable format using Day.js
const formattedDate = today.format("ddd, MMMM D, YYYY");
document.getElementById("date").innerText = formattedDate;

// Fetch puzzle data
document.getElementById("clues").innerText = "Loading puzzle...";

fetch("puzzle_schedule.json")
  .then(res => res.json())
  .then(schedule => {
    const formattedToday = today.format("YYYY-MM-DD");
    answer = schedule[formattedToday];
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
    renderStoredGuesses(); // Render guesses when data is loaded
    updateGuessStats();
    document.getElementById("guessInput").focus();
  })
  .catch(err => {
    document.getElementById("clues").innerText = "No puzzle available for today.";
    disableInputs();
    console.error("Puzzle load error:", err);
  });

// Event listener for submitting guesses
const guessInput = document.getElementById("guessInput");
if (guessInput) {
  guessInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      submitGuess();
    }
  });
}

// Normalize input word
function normalizeWord(word) {
  return pluralize.singular(word.toLowerCase());
}

// Update guess stats
function updateGuessStats() {
  const stats = document.getElementById("guess-stats");
  stats.innerText = `Guesses: ${guesses.length} Hints: ${hintsUsed}`;
}

// Check if the "How to Play" section should be hidden or shown
function toggleHowToPlay() {
  const howToPlaySection = document.getElementById("how-to-play");
  if (guesses.length > 0) {
    howToPlaySection.style.display = "none";  // Hide "How to Play" section if game has started
  } else {
    howToPlaySection.style.display = "block"; // Show "How to Play" if no guesses have been made
  }
}

let clueIndex = 3;
let currentClueIndex = 0; // This will track the current clue in the ordered list

// Render clues and store revealed ones
function renderClues() {
  const clueContainer = document.getElementById("clues");
  clueContainer.innerHTML = "";

  // Load the revealed clues from localStorage
  revealedClues.forEach((clue) => {
    const span = document.createElement("div");
    span.className = "clue";
    span.innerText = normalizeWord(clue);
    clueContainer.appendChild(span);
  });

  // Now we'll reveal clues in a fixed order from the available ones, skipping rank 1 (answer)
  const sortedWords = Object.entries(currentRanking)
    .sort((a, b) => b[1] - a[1])  // Sort by rank in descending order (50 to 10)
    .map(([word, rank]) => ({ word, rank }));

  // Get the clues ranked 23, 24, and 25 for the initial reveal
  const cluesToReveal = sortedWords.filter(({ rank }) => rank >= 23 && rank <= 25);

  // Show the first 3 clues (these should be fixed)
  for (let i = 0; i < cluesToReveal.length; i++) {
    if (!revealedClues.includes(cluesToReveal[i].word)) {  // Check if the clue is not already in revealedClues
      const span = document.createElement("div");
      span.className = "clue";
      span.innerText = normalizeWord(cluesToReveal[i].word);
      clueContainer.appendChild(span);
      revealedClues.push(cluesToReveal[i].word); // Store revealed clue
    }
  }

  // Save the revealed clues to localStorage so they persist across reloads
  localStorage.setItem('revealedClues', JSON.stringify(revealedClues));
}

// Get Another Hint function (now sequential instead of random)
function getHint() {
  const clueContainer = document.getElementById("clues");

  // Check if there are more clues to reveal
  const sortedWords = Object.entries(currentRanking)
    .sort((a, b) => b[1] - a[1])  // Sort by rank in descending order (50 to 10)
    .map(([word, rank]) => ({ word, rank }));

  // Filter out the answer (rank 1) and get the clues within the range 10 to 50
  const cluesToReveal = sortedWords.filter(({ rank }) => rank >= 10 && rank <= 50);

  // If we still have clues left to show, show the next one
  if (currentClueIndex < cluesToReveal.length) {
    const nextClue = cluesToReveal[currentClueIndex];

    // Check if the clue is not already revealed and is not rank 1 (the answer)
    if (nextClue && !revealedClues.includes(nextClue.word) && nextClue.rank !== 1) {
      const span = document.createElement("div");
      span.className = "clue";
      span.innerText = normalizeWord(nextClue.word);
      clueContainer.appendChild(span);

      revealedClues.push(nextClue.word);
      currentClueIndex++;  // Move to the next clue index

      hintsUsed++;

      updateGuessStats();

      // Save hintsUsed to localStorage
      localStorage.setItem('hintsUsed', hintsUsed);
      // Save updated revealed clues to localStorage
      localStorage.setItem('revealedClues', JSON.stringify(revealedClues));
    }
  }
}

// Function to save the guesses to localStorage
function saveGuessesToLocalStorage() {
  // Save guesses with their rank (word and rank)
  localStorage.setItem('guesses', JSON.stringify(guesses));
}

// Render stored guesses on page load
function renderStoredGuesses() {
  const guessLog = document.getElementById("guesses");
  guessLog.innerHTML = "";  // Clear previous guesses

  // Sort the guesses array by rank in ascending order (smallest rank first)
  const sortedGuesses = guesses.sort((a, b) => a.rank - b.rank);  // Ascending order

  // Loop through sorted guesses and display them with the correct ranking
  sortedGuesses.forEach(({ word, rank }) => {
    const rankDisplay = rank ? `#${rank}` : "(not ranked)";
    const entry = document.createElement("div");
    const colorClass = rank <= 499 ? "rank-green" : rank <= 4999 ? "rank-yellow" : "rank-red";
    entry.className = `guess-entry ${colorClass}`;
    entry.innerHTML = `<span class="guess-word">${word}</span><span class="rank-display">${rankDisplay}</span>`;
    guessLog.appendChild(entry);
  });
}

let firstGuessMade = false;  // Flag to track if the first guess has been made
// let isPuzzleSolved = false;

window.onload = function() {
  isPuzzleSolved = localStorage.getItem("isPuzzleSolved") === "true";  // Check if the puzzle is solved
  console.log("isPuzzleSolved at page load: ", isPuzzleSolved);

  if (isPuzzleSolved) {
    // If puzzle is solved, disable further inputs and show the congrats message
    displayCongratsMessage();
    disableInputs();
  }
};

// Function to submit a guess
function submitGuess() {
  const input = document.getElementById("guessInput");
  const guess = normalizeWord(input.value.trim());

  // Clear any previous feedback message
  const feedback = document.getElementById("feedback-message");
  if (feedback) {
    feedback.remove();
  }

  if (guess.split(/\s+/).length > 1) {
    const feedback = document.createElement("div");
    feedback.id = "feedback-message";
    feedback.style.color = "#c00";
    feedback.style.marginBottom = "10px";
    feedback.innerText = "Sorry, only one-word answers are allowed.";
    input.parentNode.insertBefore(feedback, input.nextSibling);
    input.focus();
    return; 
  }

  if (!guess) return;

  if (isPuzzleSolved) return;

  // Check if the guess has already been made
  if (guesses.some(g => g.word === guess)) {
    const feedback = document.createElement("div");
    feedback.id = "feedback-message";
    feedback.style.color = "#c00";
    feedback.style.marginBottom = "10px";
    feedback.innerText = "You've already guessed that word.";
    input.parentNode.insertBefore(feedback, input.nextSibling);
    input.focus();
    return;
  }

  const normalizedAnswer = normalizeWord(answer);  // Define normalizedAnswer here

  // Create normalizedRanking inside displayCongratsMessage to be used for tier counting
  const normalizedRanking = Object.keys(currentRanking).reduce((acc, word) => {
    acc[normalizeWord(word)] = currentRanking[word];
    return acc;
  }, {});

  // Check if the guess is not in the rankings and it's not the correct answer
  if (!(guess in normalizedRanking) && guess !== normalizedAnswer) {
    const feedback = document.createElement("div");
    feedback.id = "feedback-message";
    feedback.style.color = "#c00";
    feedback.style.marginBottom = "10px";
    feedback.innerText = "Sorry! I don't know that word.";
    input.parentNode.insertBefore(feedback, input.nextSibling);
    input.focus();
    return;
  }

  // Proceed with guessing logic if valid word is found
  const rank = guess === normalizedAnswer ? 1 : normalizedRanking[guess] || "(not ranked)";

  // Save guess with its rank
  guesses.push({ word: guess, rank });

  // Save guesses to localStorage
  saveGuessesToLocalStorage();
  updateGuessStats();

  const rankDisplay = rank === "(not ranked)" ? rank : `#${rank}`;
  const guessLog = document.getElementById("guesses");
  const entry = document.createElement("div");
  const colorClass = rank <= 499 ? "rank-green" : rank <= 4999 ? "rank-yellow" : "rank-red";
  entry.className = `guess-entry ${colorClass}`;
  entry.innerHTML = `<span class="guess-word">${guess}</span><span class="rank-display">${rankDisplay}</span>`;
  guessLog.appendChild(entry);

  sortGuessesByRank();

  input.value = "";
  input.focus();

  // Hide "How to Play" after the first guess
  if (!firstGuessMade) {
    const howToPlaySection = document.getElementById("how-to-play");
    howToPlaySection.style.display = "none";  // Hide the section
    firstGuessMade = true;  // Set the flag to true so it won't show again
  }

  if (guess === normalizedAnswer) {
    isPuzzleSolved = true;
    localStorage.setItem("isPuzzleSolved", "true");  // Save solved state in localStorage

    // Show congrats message
    displayCongratsMessage();

    disableInputs();
  }
}

function displayCongratsMessage() {
  const normalizedAnswer = normalizeWord(answer);
  const normalizedRanking = Object.keys(currentRanking).reduce((acc, word) => {
    acc[normalizeWord(word)] = currentRanking[word];
    return acc;
  }, {});

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
    // Calculate the rank of each guess
    const r = word.word === normalizedAnswer ? 1 : normalizedRanking[normalizeWord(word.word)];

    if (!r) {
      tierCounts.gray++;
    } else if (r <= 499) {
      tierCounts.green++;
    } else if (r <= 4999) {
      tierCounts.yellow++;
    } else {
      tierCounts.red++;
    }
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
}

// Function to save the guesses to localStorage
function saveGuessesToLocalStorage() {
  // Save guesses with their rank (word and rank)
  localStorage.setItem('guesses', JSON.stringify(guesses));
}

// Sort guesses by rank
function sortGuessesByRank() {
  const guessLog = document.getElementById("guesses");
  const entries = Array.from(guessLog.getElementsByClassName("guess-entry"));

  // Sort in ascending order (smallest rank first)
  entries.sort((a, b) => {
    const rankA = parseInt(a.querySelector(".rank-display").innerText.replace("#", ""));
    const rankB = parseInt(b.querySelector(".rank-display").innerText.replace("#", ""));
    return rankA - rankB;  // Ascending order
  });

  guessLog.innerHTML = "";
  entries.forEach(entry => guessLog.appendChild(entry));
}

function disableInputs() {
  const inputField = document.getElementById("guessInput");
  const submitButton = document.querySelector("button[onclick='submitGuess()']");
  const getAnotherClueButton = document.querySelector("button[onclick='getHint()']");
  
  // Disable all input fields and buttons
  inputField.disabled = true;
  submitButton.disabled = true;
  getAnotherClueButton.disabled = true;
}

// Call the function to hide "How to Play" if the game has started
toggleHowToPlay();

// Render stored guesses
renderStoredGuesses();