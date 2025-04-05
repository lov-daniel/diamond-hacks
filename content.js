const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];

if (!window.bionicActivated) {
  window.bionicActivated = true;

  let selectedElements = new Set();
  let originalContentMap = new Map(); // Store original HTML

  // Hover outline
  document.addEventListener("mouseover", (e) => {
    if (ALLOWED_TAGS.includes(e.target.tagName)) {
      e.target.style.outline = "2px solid #3498db";
      e.target.style.cursor = "pointer";
    }
  });

  document.addEventListener("mouseout", (e) => {
    if (ALLOWED_TAGS.includes(e.target.tagName)) {
      e.target.style.outline = "";
      e.target.style.cursor = "";
    }
  });

  // Click to toggle select/unselect
  document.addEventListener("click", (event) => {
    const el = event.target;

    if (
      ALLOWED_TAGS.includes(el.tagName) &&
      el.innerText.trim().split(/\s+/).length >= 5 // ⬅️ Only allow if 5+ words
    ) {
      event.preventDefault();
      event.stopPropagation();

      if (!selectedElements.has(el)) {
        selectedElements.add(el);
        originalContentMap.set(el, el.innerHTML);
        el.style.outline = "2px solid #2ecc71";
        boldFirstLetters(el);
      } else {
        selectedElements.delete(el);
        el.innerHTML = originalContentMap.get(el);
        el.style.outline = "";
        originalContentMap.delete(el);
      }
    }
  });

  // Bionic bolding with unbold first
  function boldFirstLetters(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Remove existing bolds
      const strongs = node.querySelectorAll("strong");
      strongs.forEach((strong) => {
        const parent = strong.parentNode;
        while (strong.firstChild) {
          parent.insertBefore(strong.firstChild, strong);
        }
        parent.removeChild(strong);
      });

      // Apply bolding recursively
      Array.from(node.childNodes).forEach((child) => boldFirstLetters(child));
    } else if (node.nodeType === Node.TEXT_NODE) {
      const words = node.textContent.split(/(\s+)/);
      const updatedWords = words.map((word) => {
        const trimmed = word.trim();
        if (trimmed.length > 2) {
          const split = Math.ceil(trimmed.length * 0.5);
          return `<strong>${trimmed.slice(0, split)}</strong>${trimmed.slice(
            split
          )}`;
        }
        return word;
      });
      const span = document.createElement("span");
      span.innerHTML = updatedWords.join("");
      node.replaceWith(span);
    }
  }
}
