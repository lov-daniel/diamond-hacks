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
    
      // --- Helper: Remove all highlight styles from an element ---
      function clearHighlight(el) {
        if (!el) return;
        // Remove yellow background from all spans within the element.
        el.querySelectorAll("span").forEach(span => span.style.backgroundColor = "");
        el.style.outline = "";
      }
    
  // --- Hover Effect ---
    document.addEventListener("mouseover", (e) => {
        const allowedEl = e.target.closest(ALLOWED_TAGS.join(","));
        // Only apply blue outline if the element is NOT the currently highlighted one.
        if (allowedEl && allowedEl !== window.currentHighlightEl) {
        allowedEl.style.outline = "2px solid #3498db";
        allowedEl.style.cursor = "pointer";
        }
    });
    
    document.addEventListener("mouseout", (e) => {
        const allowedEl = e.target.closest(ALLOWED_TAGS.join(","));
        // Only remove the blue outline if this element is not currently active.
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
          window.currentAnimationId = Date.now(); // New ID cancels previous animation
          clearHighlight(window.currentHighlightEl);
          window.currentHighlightEl = null;
        }
    
        // Toggle: if the same element is clicked, cancel its highlighting.
        if (window.currentHighlightEl === el) {
          window.currentAnimationId = Date.now(); // Cancel current animation
          clearHighlight(el);
          window.currentHighlightEl = null;
          return;
        }
    
        // Start highlighting the new element.
        window.currentHighlightEl = el;
        const animationId = Date.now(); // NEW: Unique ID for this animation
        window.currentAnimationId = animationId;
        el.style.outline = "2px solid #2ecc71"; // Green outline indicates active highlighting
        progressiveHighlightText(el, animationId);
      });
    
      // --- Helper: Recursively wrap text nodes with spans --- (UPDATED)
      // NEW: First collect all text nodes, then wrap each word in a span.
      function wrapTextNodes(root) {
        let spans = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
          acceptNode: function(node) {
            return /\S/.test(node.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
          }
        }, false);
        // NEW: Collect text nodes into an array before modifying the DOM.
        let textNodes = [];
        let currentNode;
        while (currentNode = walker.nextNode()) {
          textNodes.push(currentNode);
        }
        // Process each text node.
        textNodes.forEach(textNode => {
          const parent = textNode.parentNode;
          const text = textNode.nodeValue;
          const parts = text.split(/(\s+)/); // Split, keeping whitespace
          const frag = document.createDocumentFragment();
          parts.forEach(part => {
            if (/\S/.test(part)) {
              const span = document.createElement("span");
              span.textContent = part;
              frag.appendChild(span);
              spans.push(span);
            } else {
              frag.appendChild(document.createTextNode(part));
            }
          });
          parent.replaceChild(frag, textNode);
        });
        return spans;
      }
    
      // --- Helper function: Wait while highlighting is paused ---
      async function waitWhilePaused() {
        while (window.highlightPaused) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    
      // --- Function to Animate Highlighting One Word at a Time ---
      async function progressiveHighlightText(el, animationId) {
        // Instead of clearing the element's content, wrap its text nodes with spans to preserve HTML.
        const spans = wrapTextNodes(el);
    
        // Loop through each word span asynchronously.
        for (let i = 0; i < spans.length; i++) {
          // Check if a new animation has started.
          if (window.currentAnimationId !== animationId) {
            clearHighlight(el);
            return;
          }
          if (i > 0) {
            spans[i - 1].style.backgroundColor = "";
          }
          spans[i].style.backgroundColor = "yellow";
          await waitWhilePaused();
          let currentWPS = window.highlightInterval || 2;
          let delay = 1000 / currentWPS; // Convert words per second to delay in ms.
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        if (spans.length > 0) {
          spans[spans.length - 1].style.backgroundColor = "";
        }
        // Remove the outline after finishing.
        clearHighlight(el);
        if (window.currentAnimationId === animationId) {
          window.currentHighlightEl = null;
        }
      }
    }
  })();
  