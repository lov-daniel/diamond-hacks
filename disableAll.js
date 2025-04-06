// disableAll.js
// Disable Bionic Text functionality.
if (window.removeBionicListeners) {
    window.removeBionicListeners();
  }
  window.bionicActivated = false;
  
  // For Highlighting, do NOT remove event listeners.
  // Instead, set a flag to pause highlighting.
  window.disableHighlighting = true;
  
  // Disable Summarization functionality.
  if (window.removeSummarizeListeners) {
    window.removeSummarizeListeners();
  }
  window.summarizeActivated = false;
  
  // Disable Practice Questions functionality.
  if (window.removePracticeListeners) {
    window.removePracticeListeners();
  }
  window.practiceQuestionsActivated = false;
  