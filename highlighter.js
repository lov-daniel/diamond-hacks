const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];

if (!window.highlightActivated) {
  window.highlightActivated = true;

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

  // --- Click to Toggle Progressive Italic Animation ---
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
        progressiveItalicText(el); // Start the animation
      } else {
        // If already selected, restore the original content
        selectedElements.delete(el);
        el.innerHTML = originalContentMap.get(el);
        el.style.outline = "";
        originalContentMap.delete(el);
      }
    }
  });

  // --- Function to Animate Italicizing One Word at a Time ---
  function progressiveItalicText(el) {
    // Get the original text and split it into words.
    const text = el.innerText;
    const words = text.split(/\s+/);

    // Clear the element's content.
    el.innerHTML = "";

    // Create an array of spans—one for each word—and insert them into the element.
    const spans = words.map((word) => {
      const span = document.createElement("span");
      span.textContent = word;
      span.style.fontStyle = "normal";
      el.appendChild(span);
      // Add a space after each word for proper spacing.
      el.appendChild(document.createTextNode(" "));
      return span;
    });

    // Set the interval to 600ms per word.
    const interval = 600;
    let index = 0;
    const timer = setInterval(() => {
      // If we're past the first word, revert the previous word back to normal.
      if (index > 0) {
        spans[index - 1].style.fontStyle = "normal";
      }
      // If there is a current word, italicize it.
      if (index < spans.length) {
        spans[index].style.fontStyle = "italic";
        index++;
      } else {
        // Once finished, clear the timer.
        clearInterval(timer);
        // Also ensure the last word is returned to normal after a final delay.
        setTimeout(() => {
          spans[spans.length - 1].style.fontStyle = "normal";
        }, interval);
      }
    }, interval);
  }
}
