(function() {
    async function initBionic() {
      // Declare ALLOWED_TAGS within this function's scope.
      const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];
  
      if (!window.bionicActivated) {
        window.bionicActivated = true;
  
        let originalContentMap = new Map();
        let mouseoverHandler, mouseoutHandler, clickHandler;
  
        window.removeBionicListeners = function() {
          document.removeEventListener("mouseover", mouseoverHandler);
          document.removeEventListener("mouseout", mouseoutHandler);
          document.removeEventListener("click", clickHandler);
          // Clear the reference so we don't accidentally re-remove them
          window.removeBionicListeners = null;
        };
  
        // Define hover handlers
        mouseoverHandler = function(e) {
          const el = e.target.closest(ALLOWED_TAGS.join(","));
          if (!el) return;
          if (el.innerText.trim().split(/\s+/).length < 5) return;
          
          // Check if element has bionic formatting
          const isBionic = el.hasAttribute("data-bionic") || el.closest("[data-bionic='true']");
          
          // Show different outline color based on state
          if (isBionic) {
            el.style.outline = "2px solid #e74c3c"; // Red for "click to remove"
          } else {
            el.style.outline = "2px solid #2ecc71"; // Green for "click to apply"
          }
          el.style.cursor = "pointer";
        };

        mouseoutHandler = function(e) {
          const el = e.target.closest(ALLOWED_TAGS.join(","));
          if (!el) return;
          
          // Only remove outline if it's not actively bionic-formatted
          if (!el.hasAttribute("data-bionic")) {
            el.style.outline = "";
          } else {
            // Restore the bionic outline
            el.style.outline = "2px solid #2ecc71";
          }
          el.style.cursor = "";
        };
  
        // Use a lock variable to prevent multiple simultaneous actions.
        window.bionicProcessing = false; // Initially, no processing is happening.
  
        clickHandler = async function(e) {
        // If another bionic action is in progress, ignore this click.
        if (window.bionicProcessing) return;
        
        // Get the closest allowed element.
        const el = e.target.closest(ALLOWED_TAGS.join(","));
        if (!el) return;
        // Only process if the element has at least 5 words.
        if (el.innerText.trim().split(/\s+/).length < 5) return;
        
        e.preventDefault();
        e.stopPropagation();

        // Set the processing lock.
        window.bionicProcessing = true;

        // Check if this element or any parent has bionic formatting
        const bionicElement = el.closest("[data-bionic='true']") || 
                              (el.hasAttribute("data-bionic") ? el : null);
        
        if (bionicElement) {
          // Remove bionic formatting
          const original = originalContentMap.get(bionicElement);
          
          if (original) {
            // We have the original content stored, restore it
            bionicElement.innerHTML = original;
            bionicElement.removeAttribute("data-bionic");
            originalContentMap.delete(bionicElement);
            bionicElement.style.outline = "";
          } else {
            // Original content not stored (happens after switching features)
            // Manually remove bionic formatting by unwrapping <strong> tags
            removeBionicFormatting(bionicElement);
            bionicElement.removeAttribute("data-bionic");
            bionicElement.style.outline = "";
          }
          
          window.bionicProcessing = false;
          return;
        }

        // Remove any nested bionic elements first.
        removeNestedBionic(el);

        // Store the original HTML before transformation.
        originalContentMap.set(el, el.innerHTML);
        // Apply bionic bolding.
        applyBionicBolding(el);
        // Mark the element as bionic.
        el.dataset.bionic = "true";
        el.style.outline = "2px solid #2ecc71";
        
        // Release the processing lock.
        window.bionicProcessing = false;
      };
  
        // Add the event listeners.
        document.addEventListener("mouseover", mouseoverHandler);
        document.addEventListener("mouseout", mouseoutHandler);
        document.addEventListener("click", clickHandler);
  
        // 🧼 Remove any bolded children before bolding a new parent.
        function removeNestedBionic(el) {
          const innerBolded = el.querySelectorAll("[data-bionic='true']");
          innerBolded.forEach((child) => {
            const original = originalContentMap.get(child);
            if (original) {
              child.innerHTML = original;
              child.removeAttribute("data-bionic");
              originalContentMap.delete(child);
              child.style.outline = "";
            } else {
              // If no original stored, manually remove formatting
              removeBionicFormatting(child);
              child.removeAttribute("data-bionic");
              child.style.outline = "";
            }
          });
        }

        // NEW: Manually remove bionic formatting when original content is not stored
        function removeBionicFormatting(el) {
          // Find all <strong> tags and unwrap them
          const strongs = el.querySelectorAll("strong");
          strongs.forEach((strong) => {
            const parent = strong.parentNode;
            while (strong.firstChild) {
              parent.insertBefore(strong.firstChild, strong);
            }
            parent.removeChild(strong);
          });
          
          // Normalize to merge adjacent text nodes
          el.normalize();
          
          // Remove any wrapper spans that might have been added
          const wrapperSpans = el.querySelectorAll("span:not([class]):not([id])");
          wrapperSpans.forEach((span) => {
            // Only unwrap if it's a simple wrapper (no attributes except possibly style)
            if (!span.hasAttribute("data-bionic") && span.children.length === 0) {
              const parent = span.parentNode;
              while (span.firstChild) {
                parent.insertBefore(span.firstChild, span);
              }
              parent.removeChild(span);
            }
          });
          
          el.normalize();
        }
  
        // Bionic bolding function.
        function applyBionicBolding(node) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Clean up existing <strong> tags.
            const strongs = node.querySelectorAll("strong");
            strongs.forEach((strong) => {
              const parent = strong.parentNode;
              while (strong.firstChild) {
                parent.insertBefore(strong.firstChild, strong);
              }
              parent.removeChild(strong);
            });
            // Recursively apply.
            Array.from(node.childNodes).forEach((child) => applyBionicBolding(child));
          } else if (node.nodeType === Node.TEXT_NODE) {
            const words = node.textContent.split(/(\s+)/);
            const updatedWords = words.map((word) => {
              const trimmed = word.trim();
              if (trimmed.length > 2) {
                const split = Math.ceil(trimmed.length * 0.5);
                return `<strong>${trimmed.slice(0, split)}</strong>${trimmed.slice(split)}`;
              }
              return word;
            });
            const span = document.createElement("span");
            span.innerHTML = updatedWords.join("");
            node.replaceWith(span);
          }
        }
      }
    }
  
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initBionic);
    } else {
      initBionic();
    }
  })();
  