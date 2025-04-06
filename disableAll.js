// disableAll.js

// Disable Bionic Text functionality.
if (window.removeBionicListeners) {
    window.removeBionicListeners();
  }
  window.bionicActivated = false;
  
  // For Highlighting, instead of removing listeners (to preserve paused state),
  // we set the disable flag and clear global variables.
  window.disableHighlighting = true;
  window.highlightActivated = false;
  window.currentHighlightEl = null;
  window.currentAnimationId = null;
  
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
  