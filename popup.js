// --- Unified Functionality Button Handlers ---

document.getElementById("Bionic-Text").addEventListener("click", async () => { 
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["disableAll.js"] });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["content.js"] });
});

document.getElementById("summarize").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("Triggering summarization on active tab...");
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["disableAll.js"] });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["summarize.js"] });
});
document.getElementById("questions").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  console.log("Triggering practice questions on active tab...");
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["disableAll.js"] });
  await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ["practice-questions.js"] });
});

document.getElementById("start-highlight").addEventListener("click", async () => {
  // Retrieve the current slider value for highlighting speed.
  chrome.storage.local.get(["highlightSpeed"], async (result) => {
    const sliderValue = Number(result.highlightSpeed) || 2; // default to 2 words per second
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    // First, disable all functionalities (this pauses highlighting).
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["disableAll.js"]
    });
    // NEW: Immediately re-enable highlighting by resetting the disable flag.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => { window.disableHighlighting = false; }
    });
    // Then inject highlighter.js.
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["highlighter.js"]
    });

  console.log("Triggering summarization on active tab...");
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["assets/pdf.min.js", "practice-questions.js"]
  });
  });
});



// --- DOMContentLoaded: Setup UI Persistence & Active Button State ---
document.addEventListener("DOMContentLoaded", () => {
  // Instead of unconditionally removing the active state, check if the current tab URL matches the stored one.
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentUrl = tabs[0].url;
    chrome.storage.local.get(['activeButton', 'activeTabUrl'], (result) => {
      if (result.activeTabUrl && result.activeTabUrl === currentUrl) {
        // If the stored URL matches, re-apply the active state.
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
        // Clear state if URL doesn't match.
        chrome.storage.local.remove(['activeButton', 'activeTabUrl']);
      }
    });
  });

  const speedSlider = document.getElementById("highlight-speed");
  const speedDisplay = document.getElementById("speed-value");

  // Persist and display slider value.
  chrome.storage.local.get(["highlightSpeed"], (result) => {
    const storedValue = result.highlightSpeed || "2";
    speedSlider.value = storedValue;
    speedDisplay.textContent = storedValue;
  });

  speedSlider.addEventListener("input", function() {
    speedDisplay.textContent = this.value;
    chrome.storage.local.set({ highlightSpeed: this.value });
  });

  // Button active state (session-only)
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
