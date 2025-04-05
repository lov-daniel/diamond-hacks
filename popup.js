document.getElementById("highlight").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
  });

document.getElementById("start-highlight").addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["highlighter.js"]
    });
});

document.addEventListener("DOMContentLoaded", () => {
  const speedSlider = document.getElementById("highlight-speed");
  const speedDisplay = document.getElementById("speed-value");
  if (speedSlider && speedDisplay) {
    speedSlider.addEventListener("input", function() {
      speedDisplay.textContent = this.value;
    });
  } else {
    console.error("Slider elements not found.");
  }
});

// Get all the buttons
const buttons = document.querySelectorAll('button');

  function loadActiveState() {
    // Retrieve the saved active button index from local storage
    chrome.storage.local.get(['activeButton'], function(result) {
      const activeButtonIndex = result.activeButton;
  
      // If there's a saved active button, apply the 'active' class to it
      if (activeButtonIndex !== undefined) {
        buttons[activeButtonIndex].classList.add('active');
        buttons[activeButtonIndex].classList.remove('inactive');
      }
    });
  }

// Add click event listener to each button
buttons.forEach((button, index) => {
  button.addEventListener('click', () => {
    // Remove the 'active' class from all buttons and add 'inactive' class
    buttons.forEach(btn => {
      btn.classList.remove('active');
      btn.classList.add('inactive');
    });

    // Add the 'active' class to the clicked button and remove 'inactive'
    button.classList.remove('inactive');
    button.classList.add('active');

    // Save the active button index in Chrome's storage
    chrome.storage.local.set({ activeButton: index });
  });
});

// Load the saved active state when the popup opens
loadActiveState();
