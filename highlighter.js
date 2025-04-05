(function() { 
    // Wait for DOM to load before running the script
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
    
    async function init() {
      // Prevent duplicate injection
      if (window.highlightActivated) return;
      window.highlightActivated = true;
    
      // Retrieve the stored highlight speed (words per second) from chrome.storage.local.
      let wps = 2; // default: 2 words per second
      await new Promise(resolve => {
        chrome.storage.local.get(["highlightSpeed"], (result) => {
          wps = Number(result.highlightSpeed) || 2; // Set wps from storage
          window.highlightInterval = wps; // Store globally as words per second
          resolve();
        });
      });
    
      // Listen for storage changes to update the global wps value in real time.
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName === "local" && changes.highlightSpeed) {
          window.highlightInterval = Number(changes.highlightSpeed.newValue) || 2;
        }
      });
    
      // Global pause flag and event listener for Control+Space to toggle pause/resume.
      window.highlightPaused = false; // Not paused by default
      document.addEventListener("keydown", (event) => {
        if (event.code === "Space" && event.ctrlKey) { // Require Control+Space
          window.highlightPaused = !window.highlightPaused;
        }
      });
      // Automatically pause highlighting if the document is hidden.
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          window.highlightPaused = true;
        }
      });
    
      const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];
    
      // ---------------------------
      // Use a single global active element and a global animation ID.
      // ---------------------------
      window.currentHighlightEl = null; // Currently highlighted element.
      window.currentAnimationId = null;   // Unique ID for the current animation.
    
      // --- Helper: Clear highlighting on an element. ---
      function clearHighlight(el) { // NEW: This function removes yellow backgrounds and outlines.
        if (!el) return;
        const spans = el.querySelectorAll("span");
        spans.forEach(span => span.style.backgroundColor = "");
        el.style.outline = "";
      }
    
      // --- Hover Effect ---
      document.addEventListener("mouseover", (e) => {
        const allowedEl = e.target.closest(ALLOWED_TAGS.join(","));
        if (allowedEl) {
          allowedEl.style.outline = "2px solid #3498db";
          allowedEl.style.cursor = "pointer";
        }
      });
    
      document.addEventListener("mouseout", (e) => {
        const allowedEl = e.target.closest(ALLOWED_TAGS.join(","));
        if (allowedEl && allowedEl !== window.currentHighlightEl) {
          allowedEl.style.outline = "";
          allowedEl.style.cursor = "";
        }
      });
    
      // --- Click to Toggle Progressive Highlight Animation ---
      document.addEventListener("click", (event) => {
        const el = event.target.closest(ALLOWED_TAGS.join(","));
        if (!el) return;
        // Only process if the element has at least 5 words.
        if (el.innerText.trim().split(/\s+/).length < 5) return;
        event.preventDefault();
        event.stopPropagation();
    
        // If a different element is already highlighted, clear its highlighting immediately.
        if (window.currentHighlightEl && window.currentHighlightEl !== el) {
          window.currentAnimationId = Date.now(); // new id cancels previous animation
          clearHighlight(window.currentHighlightEl); // NEW: Remove highlighting from previous block
          window.currentHighlightEl = null;
        }
    
        // Toggle: if the same element is clicked, cancel its highlighting.
        if (window.currentHighlightEl === el) {
          window.currentAnimationId = Date.now(); // cancel current animation
          clearHighlight(el); // NEW: Remove highlighting from this block
          window.currentHighlightEl = null;
          return;
        }
    
        // Start highlighting the new element.
        window.currentHighlightEl = el;
        const animationId = Date.now(); // NEW: unique id for this animation
        window.currentAnimationId = animationId;
        el.style.outline = "2px solid #2ecc71"; // Green outline indicates active highlighting
        progressiveHighlightText(el, animationId);
      });
    
      // Helper function that waits while highlighting is paused.
      async function waitWhilePaused() {
        while (window.highlightPaused) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    
      // --- Function to Animate Highlighting One Word at a Time ---
      async function progressiveHighlightText(el, animationId) {
        // Get the element's text content and split it into words.
        const text = el.innerText;
        const words = text.split(/\s+/);
    
        // Clear the element's content.
        el.innerHTML = "";
    
        // Create an array of spans—one for each word—and insert them into the element.
        const spans = words.map((word) => {
          const span = document.createElement("span");
          span.textContent = word;
          span.style.backgroundColor = "";
          el.appendChild(span);
          // Add a space after each word for proper spacing.
          el.appendChild(document.createTextNode(" "));
          return span;
        });
    
        // Loop through each word asynchronously.
        for (let i = 0; i < spans.length; i++) {
          // Check if a new animation has been started.
          if (window.currentAnimationId !== animationId) {
            clearHighlight(el); // NEW: Clear highlights if animation is cancelled.
            return;
          }
          if (i > 0) {
            spans[i - 1].style.backgroundColor = "";
          }
          spans[i].style.backgroundColor = "yellow";
          await waitWhilePaused();
          let currentWPS = window.highlightInterval || 2;
          let delay = 1000 / currentWPS; // Delay in milliseconds
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        // Final delay and clear the background of the last word.
        let currentWPSFinal = window.highlightInterval || 2;
        let finalDelay = 1000 / currentWPSFinal;
        await new Promise(resolve => setTimeout(resolve, finalDelay));
        if (spans.length > 0) {
          spans[spans.length - 1].style.backgroundColor = "";
        }
        clearHighlight(el); // NEW: Ensure highlighting is removed at the end.
        // If this animation is still current, clear the active element.
        if (window.currentAnimationId === animationId) {
          window.currentHighlightEl = null;
        }
      }
    }
  })();
  