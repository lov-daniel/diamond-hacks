(function() {
  function clearAllChanges() {
    console.log("Clearing all StudyBox changes...");
    
    // Clear all bionic text
    const bionicElements = document.querySelectorAll("[data-bionic='true']");
    bionicElements.forEach(el => {
      // Remove all <strong> tags
      const strongs = el.querySelectorAll("strong");
      strongs.forEach((strong) => {
        const parent = strong.parentNode;
        while (strong.firstChild) {
          parent.insertBefore(strong.firstChild, strong);
        }
        parent.removeChild(strong);
      });
      
      el.removeAttribute("data-bionic");
      el.style.outline = "";
    });
    
    // Remove ALL <strong> tags (in case some are outside bionic elements)
    const allStrongs = document.querySelectorAll("strong");
    allStrongs.forEach(strong => {
      const parent = strong.parentNode;
      while (strong.firstChild) {
        parent.insertBefore(strong.firstChild, strong);
      }
      parent.removeChild(strong);
    });
    
    // Clear all highlighting wrapper spans
    const highlightedWords = document.querySelectorAll("span.highlighted-word");
    highlightedWords.forEach(span => {
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
    
    // Clear all outlines
    document.querySelectorAll("[style*='outline']").forEach(el => {
      el.style.outline = "";
    });
    
    // Clear all background colors from highlighting
    document.querySelectorAll("[style*='background']").forEach(el => {
      if (el.style.backgroundColor === "yellow" || el.style.backgroundColor === "rgb(255, 255, 0)") {
        el.style.backgroundColor = "";
      }
    });
    
    // Remove any summarization or quiz overlays/modals
    const overlays = document.querySelectorAll("[id^='summarization-'], [id^='quiz-'], [class*='studybox-'], [class*='summary-'], [class*='question-']");
    overlays.forEach(overlay => overlay.remove());
    
    // Normalize text nodes (merge adjacent text nodes)
    document.body.normalize();
    
    // Reset all global flags
    window.bionicActivated = false;
    window.highlightActivated = false;
    window.summarizeActivated = false;
    window.practiceQuestionsActivated = false;
    window.disableHighlighting = true;
    window.bionicProcessing = false;
    window.highlightPaused = false;
    window.currentHighlightEl = null;
    window.currentAnimationId = Date.now();
    
    // Clear any stored references
    if (window.removeBionicListeners) {
      window.removeBionicListeners = null;
    }
    if (window.removeSummarizeListeners) {
      window.removeSummarizeListeners = null;
    }
    if (window.removePracticeListeners) {
      window.removePracticeListeners = null;
    }
    
    console.log("✓ All StudyBox changes have been cleared from the page.");
  }
  
  // Execute immediately when script is loaded
  clearAllChanges();
  
  // Add keyboard shortcut listener (Ctrl + Backspace)
  if (!window.studyboxClearShortcutActive) {
    window.studyboxClearShortcutActive = true;
    
    document.addEventListener("keydown", (event) => {
      if (event.ctrlKey && event.key === "Backspace") {
        event.preventDefault();
        clearAllChanges();
        
        // Also clear active button state in storage
        if (typeof chrome !== 'undefined' && chrome.storage) {
          chrome.storage.local.remove(['activeButton', 'activeTabUrl']);
        }
      }
    });
    
    console.log("✓ Keyboard shortcut active: Ctrl + Backspace to clear all");
  }
})();