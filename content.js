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
  
        // Define hover handlers (your existing code for hover)
        mouseoverHandler = function(e) {
          // ... your existing code for Bionic Text hover ...
        };
        mouseoutHandler = function(e) {
          // ... your existing code ...
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
  
          // If already bolded (i.e. contains a parent with data-bionic), then unbold it.
          if (el.closest("[data-bionic='true']")) {
            const boldContainer = el.closest("[data-bionic='true']");
            const original = originalContentMap.get(boldContainer);
            if (original) {
              boldContainer.innerHTML = original;
              boldContainer.removeAttribute("data-bionic");
              originalContentMap.delete(boldContainer);
              boldContainer.style.outline = "";
            }
            window.bionicProcessing = false; // release lock
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
            }
          });
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
  