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
    
    // Reset disable flag so highlighting can run.
    window.disableHighlighting = false;
  
    // Retrieve the stored highlight speed (words per second) from chrome.storage.local.
    let wps = 2; // default: 2 words per second
    await new Promise(resolve => {
      chrome.storage.local.get(["highlightSpeed"], (result) => {
        wps = Number(result.highlightSpeed) || 2;
        window.highlightInterval = wps;
        resolve();
      });
    });
  
    // Listen for storage changes to update the global wps value.
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === "local" && changes.highlightSpeed) {
        window.highlightInterval = Number(changes.highlightSpeed.newValue) || 2;
      }
    });
  
    // Global pause flag and event listener for Control+Space to toggle pause/resume.
    window.highlightPaused = false;
    document.addEventListener("keydown", (event) => {
      if (event.code === "Space" && event.ctrlKey) {
        window.highlightPaused = !window.highlightPaused;
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.highlightPaused = true;
      }
    });
  
    const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];
  
    // Use a single global active element and a global animation ID.
    window.currentHighlightEl = null;
    window.currentAnimationId = null;
  
    // --- Helper: Clear highlight styles ---
    function clearHighlight(el) {
      if (!el) return;
      el.querySelectorAll("span.highlighted-word").forEach(span => {
        span.style.backgroundColor = "";
      });
      el.style.outline = "";
    }
  
    // --- Helper: Recursively wrap text nodes for highlighting ---
    // This function wraps text nodes that are not already wrapped in a span with class "highlighted-word"
    function wrapTextNodesForHighlighting(root, spans = []) {
      Array.from(root.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const text = child.nodeValue;
          const parts = text.split(/(\s+)/);
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (part.trim().length > 0) {
              const span = document.createElement("span");
              span.textContent = part;
              span.classList.add("highlighted-word");
              frag.appendChild(span);
              spans.push(span);
            } else {
              frag.appendChild(document.createTextNode(part));
            }
          });
          child.parentNode.replaceChild(frag, child);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          wrapTextNodesForHighlighting(child, spans);
        }
      });
      return spans;
    }
  
    // --- Hover Effect ---
    document.addEventListener("mouseover", (e) => {
      const allowedEl = e.target.closest(ALLOWED_TAGS.join(","));
      if (allowedEl && allowedEl !== window.currentHighlightEl) {
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
  
    // --- Click Handler for Progressive Highlight Animation ---
    document.addEventListener("click", (event) => {
      // If highlighting is disabled by another functionality, ignore clicks.
      if (window.disableHighlighting) return;
      
      const el = event.target.closest(ALLOWED_TAGS.join(","));
      if (!el) return;
      if (el.innerText.trim().split(/\s+/).length < 5) return;
      event.preventDefault();
      event.stopPropagation();
  
      // If a different element is already highlighted, clear its highlighting.
      if (window.currentHighlightEl && window.currentHighlightEl !== el) {
        window.currentAnimationId = Date.now(); // New ID cancels previous animation
        clearHighlight(window.currentHighlightEl);
        window.currentHighlightEl = null;
      }
  
      // If the same element is clicked, restart its highlighting from the beginning.
      if (window.currentHighlightEl === el) {
        window.currentAnimationId = Date.now(); // Cancel current animation
        clearHighlight(el);
        // Proceed to start a new highlight animation.
      }
  
      // Start highlighting the new element.
      window.currentHighlightEl = el;
      const animationId = Date.now();
      window.currentAnimationId = animationId;
      el.style.outline = "2px solid #2ecc71"; // Green outline indicates active highlighting
      progressiveHighlightText(el, animationId);
    });
  
    // --- Helper: Wait while highlighting is paused ---
    async function waitWhilePaused() {
      while (window.highlightPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  
    // --- Function: Animate Highlighting One Word at a Time ---
    async function progressiveHighlightText(el, animationId) {
      // Wrap text nodes for highlighting; this does not remove bionic formatting.
      const spans = wrapTextNodesForHighlighting(el);
      let i = 0;
      while (i < spans.length) {
        // If a new animation has started, exit.
        if (window.currentAnimationId !== animationId) {
          clearHighlight(el);
          return;
        }
        // If paused, wait (do not reset index).
        while (window.highlightPaused || window.disableHighlighting) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (i > 0) {
          spans[i - 1].style.backgroundColor = "";
        }
        spans[i].style.backgroundColor = "yellow";
        let currentWPS = window.highlightInterval || 2;
        let delay = 1000 / currentWPS;
        await new Promise(resolve => setTimeout(resolve, delay));
        i++;
      }
      if (spans.length > 0) {
        spans[spans.length - 1].style.backgroundColor = "";
      }
      // Do not clear the outline; let it remain to show that the highlight is active.
      if (window.currentAnimationId === animationId) {
        // Leave currentHighlightEl set so that highlighting can be paused/resumed.
      }
    }
  }
})();
