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
  const DEFAULT_DURATION = 25 * 60; // 25 minutes in seconds
  let timerInterval = null;
  let remainingTime = DEFAULT_DURATION;
  let isPaused = false;

  // Pomodoro elements (make sure these IDs exist in your HTML)
  const timerDisplay = document.getElementById('timer-display');
  const pomodoroStart = document.getElementById('pomodoro-start');
  const pomodoroPause = document.getElementById('pomodoro-pause');
  const pomodoroStop = document.getElementById('pomodoro-stop');

  // Update the timer display (mm:ss)
  function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60).toString().padStart(2, '0');
    const seconds = (remainingTime % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }

  // Save the current timer state to localStorage for persistence.
  function savePomodoroState() {
    const state = {
      remainingTime: remainingTime,
      isPaused: isPaused,
      lastUpdate: Date.now()
    };
    localStorage.setItem('pomodoroState', JSON.stringify(state));
  }

  // Load timer state from localStorage.
  function loadPomodoroState() {
    const savedState = localStorage.getItem('pomodoroState');
    if (savedState) {
      const state = JSON.parse(savedState);
      remainingTime = state.remainingTime;
      isPaused = state.isPaused;
      // If timer was running, calculate elapsed time.
      if (!isPaused && state.lastUpdate) {
        const elapsed = Math.floor((Date.now() - state.lastUpdate) / 1000);
        remainingTime = Math.max(0, remainingTime - elapsed);
      }
      updateTimerDisplay();
    }
  }

  // Start (or resume) the Pomodoro timer.
  function startPomodoro() {
    clearInterval(timerInterval);
    isPaused = false;
    savePomodoroState();
    timerInterval = setInterval(() => {
      if (!isPaused) {
        if (remainingTime > 0) {
          remainingTime--;
          updateTimerDisplay();
          savePomodoroState();
        } else {
          clearInterval(timerInterval);
          alert('Pomodoro complete!');
          // Optionally, reset the timer here.
        }
      }
    }, 1000);
  }

  // Toggle pause/resume state.
  function togglePomodoro() {
    if (remainingTime <= 0) return;
    isPaused = !isPaused;
    savePomodoroState();
    pomodoroPause.textContent = isPaused ? 'Resume' : 'Pause';
  }

  // Stop the timer and reset to default duration.
  function stopPomodoro() {
    clearInterval(timerInterval);
    remainingTime = DEFAULT_DURATION;
    isPaused = false;
    updateTimerDisplay();
    savePomodoroState();
    pomodoroPause.textContent = 'Pause';
  }

  // Event listeners for Pomodoro timer controls.
  pomodoroStart.addEventListener('click', startPomodoro);
  pomodoroPause.addEventListener('click', togglePomodoro);
  pomodoroStop.addEventListener('click', stopPomodoro);

  // Initialize timer state on load.
  loadPomodoroState();
  // If the timer was running (not paused) and not at full duration, resume it.
  if (!isPaused && remainingTime < DEFAULT_DURATION) {
    startPomodoro();
  }
});
