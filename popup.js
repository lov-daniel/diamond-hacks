document.getElementById("get-content").addEventListener("click", async () => {
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
  