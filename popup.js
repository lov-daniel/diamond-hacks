// --- Unified Functionality Button Handlers ---

document.getElementById("Bionic-Text").addEventListener("click", async () => { 
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // First disable all functionalities.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["disableAll.js"]
  });
  // Then inject Bionic Text functionality.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

document.getElementById("summarize").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("Triggering summarization on active tab...");
  // Disable all functionalities.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["disableAll.js"]
  });
  // Then inject Summarization functionality.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["summarize.js", "assets/pdf.min.js"]
  });
});

document.getElementById("questions").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("Triggering practice questions on active tab...");
  // Disable all functionalities.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["disableAll.js"]
  });
  // Then inject Practice Questions functionality.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["practice-questions.js", "assets/pdf.min.js"]
  });
});

// Add this with the other button handlers
document.getElementById("clear-all").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("Clearing all changes from the page...");
  
  // First disable all functionalities
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["disableAll.js"]
  });
  
  // Then clear all changes
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["clearAll.js"]
  });
  
  // Clear active button state
  chrome.storage.local.remove(['activeButton', 'activeTabUrl']);
  
  // Reset all buttons to inactive
  const buttons = document.querySelectorAll('button');
  buttons.forEach(btn => {
    btn.classList.remove('active');
    btn.classList.add('inactive');
  });
});

document.getElementById("start-highlight").addEventListener("click", async () => {
  // Retrieve the current slider value for highlighting speed.
  chrome.storage.local.get(["highlightSpeed"], async (result) => {
    const sliderValue = Number(result.highlightSpeed) || 2; // default to 2 words per second
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // Disable all functionalities (this pauses highlighting).
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["disableAll.js"]
    });
    // Immediately re-enable highlighting by resetting the disable flag.
    // (Note: The animation remains paused until resumed via Ctrl+Space or a click on the element.)
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => { window.disableHighlighting = false; }
    });
    // Then inject highlighter.js.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["highlighter.js"]
    });
  });
});

// --- DOMContentLoaded: Setup UI Persistence, Active Button State & Pomodoro Timer ---
document.addEventListener("DOMContentLoaded", () => {
  // Existing UI state and slider persistence code.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    chrome.storage.local.get(['activeButton', 'activeTabUrl'], (result) => {
      if (result.activeTabUrl && result.activeTabUrl === currentUrl) {
        const activeButtonIndex = result.activeButton;
        if (activeButtonIndex !== undefined) {
          const buttons = document.querySelectorAll('button');
          buttons.forEach((btn, index) => {
            if (index === activeButtonIndex) {
              btn.classList.add('active');
              btn.classList.remove('inactive');
            } else {
              btn.classList.remove('active');
              btn.classList.add('inactive');
            }
          });
        }
      } else {
        chrome.storage.local.remove(['activeButton', 'activeTabUrl']);
      }
    });
  });

  const speedSlider = document.getElementById("highlight-speed");
  const speedDisplay = document.getElementById("speed-value");
  chrome.storage.local.get(["highlightSpeed"], (result) => {
    const storedValue = result.highlightSpeed || "2";
    speedSlider.value = storedValue;
    speedDisplay.textContent = storedValue;
  });

  speedSlider.addEventListener("input", function() {
    speedDisplay.textContent = this.value;
    chrome.storage.local.set({ highlightSpeed: this.value });
  });

  // --- Button Active State (Session-only) ---
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('inactive');
      });
      button.classList.remove('inactive');
      button.classList.add('active');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;
        chrome.storage.local.set({ activeButton: index, activeTabUrl: currentUrl });
      });
    });
  });

  // --- Pomodoro Timer Code ---
  // Pomodoro constants
  const FOCUS_DURATION = 25 * 60; // 25 minutes
  const BREAK_DURATION = 5 * 60; // 5 minutes

  // Get elements
  const timerDisplay = document.getElementById('timer-display');
  const pomodoroStart = document.getElementById('pomodoro-start');
  const pomodoroPause = document.getElementById('pomodoro-pause');
  const pomodoroStop = document.getElementById('pomodoro-stop');
  const modeFocusBtn = document.getElementById('mode-focus');
  const modeBreakBtn = document.getElementById('mode-break');

  let timerInterval = null;
  let remainingTime = FOCUS_DURATION;
  let isPaused = true;
  let currentMode = 'focus'; // 'focus' or 'break'
  let hasNotified = false; // Prevent multiple notifications

  // Load saved timer state from chrome.storage.local
  function loadTimerState() {
    chrome.storage.local.get(['pomodoroState'], (result) => {
      if (result.pomodoroState) {
        const state = result.pomodoroState;
        remainingTime = state.remainingTime;
        isPaused = state.isPaused;
        currentMode = state.mode || 'focus';
        hasNotified = state.hasNotified || false;

        // Calculate elapsed time if timer was running
        if (!isPaused && state.lastUpdate) {
          const elapsed = Math.floor((Date.now() - state.lastUpdate) / 1000);
          remainingTime = Math.max(0, remainingTime - elapsed);

          // Check if timer completed while popup was closed
          if (remainingTime === 0 && !hasNotified) {
            handleTimerComplete();
          }
        }

        updateDisplay();
        updateModeButtons();
        updatePauseButton();

        // Resume timer if it was running
        if (!isPaused && remainingTime > 0) {
          startTimer();
        }
      }
    });
  }

  // Save timer state to chrome.storage.local
  function saveTimerState() {
    const state = {
      remainingTime,
      isPaused,
      mode: currentMode,
      lastUpdate: Date.now(),
      hasNotified
    };
    chrome.storage.local.set({ pomodoroState: state });
  }

  // Update the timer display (mm:ss)
  function updateDisplay() {
    const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    const seconds = (remainingTime % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }

  // Update mode button states
  function updateModeButtons() {
  if (currentMode === 'focus') {
    modeFocusBtn.classList.add('active-mode');
    modeBreakBtn.classList.remove('active-mode');
    document.getElementById('pomodoro-container').classList.remove('break-mode'); 
  } else {
    modeBreakBtn.classList.add('active-mode');
    modeFocusBtn.classList.remove('active-mode');
    document.getElementById('pomodoro-container').classList.add('break-mode');
  }

    // Disable mode buttons while timer is running
    const isRunning = !isPaused && remainingTime > 0;
    modeFocusBtn.disabled = isRunning;
    modeBreakBtn.disabled = isRunning;
  }

  // Update pause button text
function updatePauseButton() {
  const initialTime = currentMode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
  if (remainingTime === initialTime && isPaused) {
    pomodoroStart.textContent = 'Start';
  } else {
    pomodoroStart.textContent = isPaused ? 'Resume' : 'Pause';
  }
}

  // Handle timer completion
  function handleTimerComplete() {
    if (hasNotified) return; // Already notified
    
    hasNotified = true;
    clearInterval(timerInterval);

    // Show notification
    const completedMode = currentMode;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'assets/Icon.png',
      title: completedMode === 'focus' ? '🎯 Focus Complete!' : '☕ Break Complete!',
      message: completedMode === 'focus' 
        ? 'Great work! Time for a 5-minute break.' 
        : 'Break is over. Ready to focus again?',
      priority: 2,
      requireInteraction: false
    });

    // Auto-switch to the other mode
    setTimeout(() => {
      if (currentMode === 'focus') {
        switchMode('break');
      } else {
        switchMode('focus');
      }
      hasNotified = false;
      saveTimerState();
    }, 1000);
  }

  // Start the timer countdown
  function startTimer() {
    clearInterval(timerInterval);
    isPaused = false;
    hasNotified = false;
    saveTimerState();
    updatePauseButton();
    updateModeButtons();

    timerInterval = setInterval(() => {
      if (!isPaused) {
        if (remainingTime > 0) {
          remainingTime--;
          updateDisplay();
          saveTimerState();
        } else {
          handleTimerComplete();
        }
      }
    }, 1000);

    updatePauseButton();
  }

  // Pause or resume the timer
  function togglePause() {
    if (remainingTime <= 0) return;

    isPaused = !isPaused;
    saveTimerState();
    updatePauseButton();
    updateModeButtons();

    if (!isPaused) {
      startTimer();
    } else {
      clearInterval(timerInterval);
    }
  }

  // Stop the timer and reset it
  function stopTimer() {
    clearInterval(timerInterval);
    isPaused = true;
    hasNotified = false;
    remainingTime = currentMode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
    updateDisplay();
    saveTimerState();
    updatePauseButton();
    updateModeButtons();
  }

  // Switch between Focus and Break modes
  function switchMode(mode) {
    if (!isPaused && remainingTime > 0) return; // Don't switch while running

    currentMode = mode;
    remainingTime = mode === 'focus' ? FOCUS_DURATION : BREAK_DURATION;
    isPaused = true;
    hasNotified = false;
    clearInterval(timerInterval);
    
    updateDisplay();
    updateModeButtons();
    updatePauseButton();
    saveTimerState();
  }

  // Event Listeners
  pomodoroStart.addEventListener('click', () => {
    if (isPaused) {
      startTimer();
    } else {
      togglePause();
    }
  });
  pomodoroStop.addEventListener('click', stopTimer);

  modeFocusBtn.addEventListener('click', () => switchMode('focus'));
  modeBreakBtn.addEventListener('click', () => switchMode('break'));

  // Initialize timer state on load
  loadTimerState();
});