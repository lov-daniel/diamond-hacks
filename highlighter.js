(function() {
    // Wait for DOM to load before running the script
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", init);
    } else {
      init();
    }
  
    function init() {
      // Prevent duplicate injection
      if (window.highlightActivated) return;
      window.highlightActivated = true;
  
      // ADDED: Get the slider elements from the DOM
      const speedSlider = document.getElementById("highlight-speed");
      const speedDisplay = document.getElementById("speed-value");
      if (speedSlider && speedDisplay) {
        // ADDED: Update the displayed speed as the slider is adjusted
        speedSlider.addEventListener("input", () => {
          speedDisplay.textContent = speedSlider.value;
        });
      } else {
        console.error("Slider elements not found.");
      }
  
      const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];
  
      // To keep track of selected elements and store their original HTML
      let selectedElements = new Set();
      let originalContentMap = new Map();
  
      // --- Hover Effect ---
      document.addEventListener("mouseover", (e) => {
        if (ALLOWED_TAGS.includes(e.target.tagName)) {
          e.target.style.outline = "2px solid #3498db";
          e.target.style.cursor = "pointer";
        }
      });
  
      document.addEventListener("mouseout", (e) => {
        if (ALLOWED_TAGS.includes(e.target.tagName)) {
          // Only remove the blue outline if the element isn't selected
          if (!selectedElements.has(e.target)) {
            e.target.style.outline = "";
            e.target.style.cursor = "";
          }
        }
      });
  
      // --- Click to Toggle Progressive Highlight Animation ---
      document.addEventListener("click", (event) => {
        const el = event.target;
        if (
          ALLOWED_TAGS.includes(el.tagName) &&
          el.innerText.trim().split(/\s+/).length >= 5
        ) {
          event.preventDefault();
          event.stopPropagation();
  
          if (!selectedElements.has(el)) {
            selectedElements.add(el);
            originalContentMap.set(el, el.innerHTML);
            el.style.outline = "2px solid #2ecc71";
            progressiveHighlightText(el); // Start the animation
          } else {
            // If already selected, restore the original content
            selectedElements.delete(el);
            el.innerHTML = originalContentMap.get(el);
            el.style.outline = "";
            originalContentMap.delete(el);
          }
        }
      });
  
      // --- Function to Animate Highlighting One Word at a Time ---
      async function progressiveHighlightText(el) {
        // Get the element's text content and split it into words.
        const text = el.innerText;
        const words = text.split(/\s+/);
  
        // Clear the element's content.
        el.innerHTML = "";
  
        // Create an array of spans—one for each word—and insert them into the element.
        const spans = words.map((word) => {
          const span = document.createElement("span");
          span.textContent = word;
          // Initially, no background color.
          span.style.backgroundColor = "";
          el.appendChild(span);
          // Add a space after each word for proper spacing.
          el.appendChild(document.createTextNode(" "));
          return span;
        });
  
        // Loop through each word asynchronously.
        for (let i = 0; i < spans.length; i++) {
          // CHANGED: Read the current slider value for a dynamic interval.
          const interval = speedSlider ? Number(speedSlider.value) : 600; // fallback to 600 if slider is not found
          // Unhighlight the previous word, if any.
          if (i > 0) {
            spans[i - 1].style.backgroundColor = "";
          }
          // Highlight the current word.
          spans[i].style.backgroundColor = "yellow";
          // Wait for the interval before moving to the next word.
          await new Promise(resolve => setTimeout(resolve, interval));
        }
        // After the loop, wait one final interval and then unhighlight the last word.
        const finalInterval = speedSlider ? Number(speedSlider.value) : 600;
        await new Promise(resolve => setTimeout(resolve, finalInterval));
        spans[spans.length - 1].style.backgroundColor = "";
      }
    }
  })();
  