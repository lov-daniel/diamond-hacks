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


// --- DOMContentLoaded: Setup UI Persistence & Active Button State ---
document.addEventListener("DOMContentLoaded", () => {
  // Query the current active tab URL.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    // Retrieve any stored active state.
    chrome.storage.local.get(['activeButton', 'activeTabUrl'], (result) => {
      // Re-apply active state only if the stored URL matches the current URL.
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
        // Clear stored state if URL does not match.
        chrome.storage.local.remove(['activeButton', 'activeTabUrl']);
      }
    });
  });

  const speedSlider = document.getElementById("highlight-speed");
  const speedDisplay = document.getElementById("speed-value");

  // Persist and display the slider value.
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
      // Save the active button index and current tab URL.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;
        chrome.storage.local.set({ activeButton: index, activeTabUrl: currentUrl });
      });
    });
  });
});
