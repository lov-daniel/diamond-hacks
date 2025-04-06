// --- Unified Functionality Button Handlers ---

document.getElementById("Bionic-Text").addEventListener("click", async () => { 
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  // First disable all functionalities.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["disableAll.js"]
  });
  // Then inject the Bionic Text functionality.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

document.getElementById("summarize").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("Triggering summarization on active tab...");
  // First disable all functionalities.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["disableAll.js"]
  });
  // Then inject the Summarize functionality.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["summarize.js"]
  });
});

document.getElementById("questions").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("Triggering practice questions on active tab...");
  // First disable all functionalities.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["disableAll.js"]
  });
  // Then inject the Practice Questions functionality.
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["practice-questions.js"]
  });
});

document.getElementById("start-highlight").addEventListener("click", async () => {
  // Retrieve the current slider value for highlighting speed.
  chrome.storage.local.get(["highlightSpeed"], async (result) => {
    const sliderValue = Number(result.highlightSpeed) || 2; // default to 2 words per second
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // First disable all functionalities.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["disableAll.js"]
    });
    // Then inject the Highlighting functionality.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["highlighter.js"]
    });
  });
});


// --- DOMContentLoaded: Setup UI Persistence & Active Button State ---
document.addEventListener("DOMContentLoaded", () => {
  // Clear any stored active state on popup load.
  chrome.storage.local.remove(['activeButton', 'activeTabUrl']);

  const speedSlider = document.getElementById("highlight-speed");
  const speedDisplay = document.getElementById("speed-value");

  // --- Persist and Display Slider Value ---
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
      // Remove 'active' class from all buttons.
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('inactive');
      });
      // Mark the clicked button as active.
      button.classList.remove('inactive');
      button.classList.add('active');

      // Save the active button index and current tab URL (for session use only).
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;
        chrome.storage.local.set({ activeButton: index, activeTabUrl: currentUrl });
      });
    });
  });
});
