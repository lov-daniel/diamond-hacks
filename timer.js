// pomodoro.js

// Define the default duration (25 minutes)
const DEFAULT_DURATION = 25 * 60; // in seconds

// Get elements
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('pomodoro-start');
const pauseBtn = document.getElementById('pomodoro-pause');
const stopBtn = document.getElementById('pomodoro-stop');

let timerInterval = null;
let remainingTime = DEFAULT_DURATION;
let isPaused = false;

// Load saved timer state from localStorage
function loadTimerState() {
  const savedState = localStorage.getItem('pomodoroState');
  if (savedState) {
    const state = JSON.parse(savedState);
    remainingTime = state.remainingTime;
    isPaused = state.isPaused;
    // Calculate the time elapsed if the timer was running
    if (!isPaused && state.lastUpdate) {
      const elapsed = Math.floor((Date.now() - state.lastUpdate) / 1000);
      remainingTime = Math.max(0, remainingTime - elapsed);
    }
    updateDisplay();
  }
}

// Save current timer state to localStorage
function saveTimerState() {
  const state = {
    remainingTime,
    isPaused,
    lastUpdate: Date.now()
  };
  localStorage.setItem('pomodoroState', JSON.stringify(state));
}

// Update the timer display in mm:ss format
function updateDisplay() {
  const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
  const seconds = (remainingTime % 60).toString().padStart(2, '0');
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

// Start the timer countdown
function startTimer() {
  // Clear any existing timer
  clearInterval(timerInterval);
  isPaused = false;
  saveTimerState();
  
  timerInterval = setInterval(() => {
    if (!isPaused) {
      if (remainingTime > 0) {
        remainingTime--;
        updateDisplay();
        saveTimerState();
      } else {
        clearInterval(timerInterval);
        alert('Pomodoro complete!');
        // Reset for next session if desired
      }
    }
  }, 1000);
}

// Pause or resume the timer
function togglePause() {
  if (remainingTime <= 0) return;
  
  isPaused = !isPaused;
  saveTimerState();
  
  // Optionally update the button text based on state
  pauseBtn.textContent = isPaused ? 'Resume' : 'Pause';
}

// Stop the timer and reset it to default duration
function stopTimer() {
  clearInterval(timerInterval);
  remainingTime = DEFAULT_DURATION;
  isPaused = false;
  updateDisplay();
  saveTimerState();
  pauseBtn.textContent = 'Pause';
}

// Event Listeners
startBtn.addEventListener('click', () => {
  startTimer();
});

pauseBtn.addEventListener('click', () => {
  togglePause();
});

stopBtn.addEventListener('click', () => {
  stopTimer();
});

// On page load, initialize the timer state
document.addEventListener('DOMContentLoaded', () => {
  loadTimerState();
  // If the timer was running, resume it:
  if (!isPaused && remainingTime < DEFAULT_DURATION) {
    startTimer();
  }
});
