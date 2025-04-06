document.getElementById("highlight").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"]
  });
});

document.getElementById("summarize").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  console.log("Triggering summarization on active tab...");
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["assets/pdf.min.js", "summarize.js"]
  });
});

document.getElementById("questions").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  console.log("Triggering summarization on active tab...");
  await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["assets/pdf.min.js", "practice-questions.js"]
  });
});


document.addEventListener("DOMContentLoaded", () => {
  // ADDED: Clear any stored active state every time the popup loads.
  // This resets the button active state when the website is refreshed or changed.
  chrome.storage.local.remove(['activeButton', 'activeTabUrl']);

  const speedSlider = document.getElementById("highlight-speed");
  const speedDisplay = document.getElementById("speed-value");

  // --- Persist and display slider value ---
  // Retrieve the stored slider value (default: "2" words per second).
  chrome.storage.local.get(["highlightSpeed"], (result) => {
    const storedValue = result.highlightSpeed || "2";
    speedSlider.value = storedValue;
    speedDisplay.textContent = storedValue;
  });

  // When the slider is adjusted, update the display and store the new value.
  speedSlider.addEventListener("input", function() {
    speedDisplay.textContent = this.value;
    chrome.storage.local.set({ highlightSpeed: this.value });
  });

  // When "Start Highlighting" is clicked, retrieve the saved speed and inject highlighter.js.
  document.getElementById("start-highlight").addEventListener("click", async () => {
    chrome.storage.local.get(["highlightSpeed"], async (result) => {
      const sliderValue = Number(result.highlightSpeed) || 2; // Use saved value or default to 2 wps
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["highlighter.js"]
        // highlighter.js will read the stored value from chrome.storage.
      });
    });
  });

  // ------------------------------
  // Button active state (persisted only during the current session)
  // ------------------------------

  // Get all the buttons in the popup.
  const buttons = document.querySelectorAll('button');

  // Add click event listener to each button.
  buttons.forEach((button, index) => {
    button.addEventListener('click', () => {
      // Remove the 'active' class from all buttons and add 'inactive'.
      buttons.forEach(btn => {
        btn.classList.remove('active');
        btn.classList.add('inactive');
      });
      // Mark the clicked button as active (for the current session).
      button.classList.remove('inactive');
      button.classList.add('active');

      // Save the active button index and current tab URL in storage.
      // This persistence is only used while the popup is open.
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentUrl = tabs[0].url;
        chrome.storage.local.set({ activeButton: index, activeTabUrl: currentUrl });
      });
    });
  });

  // ADDED: We no longer load an active state on popup open since we've cleared it above.
});
