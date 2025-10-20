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
        // (Do not auto-unpause disableHighlighting here; user must resume via Ctrl+Space.)
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        window.highlightPaused = true;
      }
    });
  
    const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];

      function extractCompleteWords(el) {
        const words = [];
        const textContent = el.textContent;
        const wordBoundaries = textContent.split(/\s+/).filter(w => w.trim().length > 0);
        
        // Now find these words in the DOM structure
        const spans = el.querySelectorAll("span.highlighted-word");
        let currentWord = "";
        let currentSpans = [];
        
        spans.forEach((span, index) => {
          const spanText = span.textContent.trim();
          
          if (spanText.length === 0) return;
          
          currentWord += spanText;
          currentSpans.push(span);
          
          // Check if we've completed a word
          const nextSpan = spans[index + 1];
          const hasSpaceAfter = !nextSpan || 
                              span.nextSibling?.nodeType === Node.TEXT_NODE && 
                              /\s/.test(span.nextSibling.textContent);
          
          if (hasSpaceAfter || !nextSpan) {
            if (currentWord.length > 0) {
              words.push({
                text: currentWord,
                spans: [...currentSpans]
              });
            }
            currentWord = "";
            currentSpans = [];
          }
        });
        
        return words;
      }

  
    // Use a single global active element and a global animation ID.
    window.currentHighlightEl = null;
    window.currentAnimationId = null;
  
    // --- Helper: Clear highlight styles (but preserve bionic text) ---
    function clearHighlight(el) {
      if (!el) return;
      
      // Clear all background colors
      el.querySelectorAll("span.highlighted-word").forEach(span => {
        span.style.backgroundColor = "";
      });
      
      // Only clear outline if it's not a bionic element
      if (!el.hasAttribute("data-bionic")) {
        el.style.outline = "";
      }
    }
  
    // --- Helper: Recursively wrap text nodes for highlighting ---
  // This version preserves <strong> tags from bionic text
  function wrapTextNodesForHighlighting(root, spans = []) {
    Array.from(root.childNodes).forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.nodeValue;
        // Skip empty or whitespace-only text nodes
        if (!text.trim()) {
          return;
        }
        const parts = text.split(/(\s+)/);
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (part.trim().length > 0) {
            const span = document.createElement("span");
            span.textContent = part;
            span.classList.add("highlighted-word");
            frag.appendChild(span);
            spans.push(span);
          } else if (part.length > 0) {
            // Preserve whitespace
            frag.appendChild(document.createTextNode(part));
          }
        });
        child.parentNode.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        // Skip if already a highlighted-word span (prevents double-wrapping)
        if (child.classList && child.classList.contains("highlighted-word")) {
          spans.push(child);
          return;
        }
        
        // If it's a <strong> tag from bionic text, wrap it in a highlighted-word span
        if (child.tagName === "STRONG") {
          // Check if it's not already wrapped
          if (!child.parentNode.classList || !child.parentNode.classList.contains("highlighted-word")) {
            const span = document.createElement("span");
            span.classList.add("highlighted-word");
            span.appendChild(child.cloneNode(true));
            child.parentNode.replaceChild(span, child);
            spans.push(span);
          }
        } else {
          wrapTextNodesForHighlighting(child, spans);
        }
      }
    });
    return spans;
  }
  
 // --- Helper: Merge adjacent highlighted-word spans to form complete words ---
  function mergeAdjacentHighlightedSpans(root) {
    const children = Array.from(root.childNodes);
    children.forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        mergeAdjacentHighlightedSpans(child);
      }
    });
    
    // Merge adjacent highlighted-word spans (these form complete words)
    for (let i = 0; i < root.childNodes.length - 1; ) {
      const current = root.childNodes[i];
      const next = root.childNodes[i + 1];
      
      if (current.nodeType === Node.ELEMENT_NODE &&
          current.classList.contains("highlighted-word") &&
          next.nodeType === Node.ELEMENT_NODE &&
          next.classList.contains("highlighted-word")) {
        
        // Check if there's whitespace between them in the original text
        // If not, merge them (they're part of the same word split by bionic)
        const currentText = current.textContent;
        const nextText = next.textContent;
        
        // Merge if the current doesn't end with whitespace and next doesn't start with whitespace
        if (currentText.trim() === currentText && nextText.trim() === nextText) {
          // Preserve the innerHTML to keep <strong> tags
          current.innerHTML += next.innerHTML;
          root.removeChild(next);
          // Don't increment i, check again
        } else {
          i++;
        }
      } else {
        i++;
      }
    }
  }

    // --- Helper: Remove all highlighting wrapper spans from an element ---
  function removeHighlightWrappers(el) {
    const highlightedSpans = el.querySelectorAll("span.highlighted-word");
    highlightedSpans.forEach(span => {
      // Replace span with its contents
      const parent = span.parentNode;
      while (span.firstChild) {
        parent.insertBefore(span.firstChild, span);
      }
      parent.removeChild(span);
    });
    // Normalize to merge adjacent text nodes
    el.normalize();
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
      if (window.disableHighlighting) return;
      
      const el = event.target.closest(ALLOWED_TAGS.join(","));
      if (!el) return;
      if (el.innerText.trim().split(/\s+/).length < 5) return;
      event.preventDefault();
      event.stopPropagation();

      // If a different element is already highlighted, clear and clean it up completely
      if (window.currentHighlightEl && window.currentHighlightEl !== el) {
        window.currentAnimationId = Date.now(); // Cancel previous animation
        clearHighlight(window.currentHighlightEl);
        removeHighlightWrappers(window.currentHighlightEl); // NEW: Remove all wrapper spans
        
        // Restore bionic outline if it was a bionic element
        if (window.currentHighlightEl.hasAttribute("data-bionic")) {
          window.currentHighlightEl.style.outline = "2px solid #2ecc71";
        } else {
          window.currentHighlightEl.style.outline = "";
        }
        window.currentHighlightEl = null;
      }

      // Toggle: if the same element is clicked, restart the animation
      if (window.currentHighlightEl === el) {
        window.currentAnimationId = Date.now(); // Cancel current animation
        clearHighlight(el);
        removeHighlightWrappers(el); // NEW: Clean up before restarting
        progressiveHighlightText(el, window.currentAnimationId, 0);
        return;
      }

      // Start highlighting the new element
      window.currentHighlightEl = el;
      const animationId = Date.now();
      window.currentAnimationId = animationId;
      
      // Use blue outline for highlighting (green is for bionic text)
      if (el.hasAttribute("data-bionic")) {
        el.style.outline = "2px solid #2ecc71"; // Keep green for bionic
      } else {
        el.style.outline = "2px solid #3498db"; // Blue for highlight-only
      }
      
      progressiveHighlightText(el, animationId, 0);
    });
  
    // --- Helper: Wait while highlighting is paused ---
    async function waitWhilePaused() {
      while (window.highlightPaused) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  
    // --- Function: Animate Highlighting One Word at a Time ---
    async function progressiveHighlightText(el, animationId, startIndex = 0) {
      // First wrap all text nodes
      wrapTextNodesForHighlighting(el);
      // Then merge adjacent spans that form complete words
      mergeAdjacentHighlightedSpans(el);
      
      // Extract complete words (groups of spans)
      const words = extractCompleteWords(el);

      let i = startIndex;
      while (i < words.length) {
        // Check if animation was cancelled or highlighting disabled
        if (window.currentAnimationId !== animationId || window.disableHighlighting) {
          clearHighlight(el);
          return;
        }
        
        while (window.highlightPaused) {
          el.highlightIndex = i;
          await new Promise(resolve => setTimeout(resolve, 100));
          if (window.disableHighlighting || window.currentAnimationId !== animationId) {
            clearHighlight(el);
            return;
          }
        }
        
        // Clear previous word
        if (i > 0) {
          words[i - 1].spans.forEach(span => {
            span.style.backgroundColor = "";
          });
        }
        
        // Highlight all spans in current word
        words[i].spans.forEach(span => {
          span.style.backgroundColor = "yellow";
        });
        
        let currentWPS = window.highlightInterval || 2;
        let delay = 1000 / currentWPS;
        await new Promise(resolve => setTimeout(resolve, delay));
        i++;
      }
      
      // Clear the last word
      if (words.length > 0) {
        words[words.length - 1].spans.forEach(span => {
          span.style.backgroundColor = "";
        });
      }
      
      if (window.currentAnimationId === animationId) {
        el.highlightIndex = i;
      }
    }
  }
})();
