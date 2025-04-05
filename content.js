const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];

if (!window.bionicActivated) {
  window.bionicActivated = true;

  let selectedElements = new Set();
  let originalContentMap = new Map(); // Store original HTML

  // Hover outline
  document.addEventListener("mouseover", (e) => {
    if (
      ALLOWED_TAGS.includes(e.target.tagName) &&
      !e.target.closest(".bionic-wrapper")
    ) {
      e.target.style.outline = "2px solid #3498db";
      e.target.style.cursor = "pointer";
    }
  });

  document.addEventListener("mouseout", (e) => {
    if (
      ALLOWED_TAGS.includes(e.target.tagName) &&
      !e.target.closest(".bionic-wrapper")
    ) {
      e.target.style.outline = "";
      e.target.style.cursor = "";
    }
  });

  // Click to toggle select/unselect
  document.addEventListener("click", (event) => {
    const el = event.target;

    // Ensure text has 5+ words and is not bolded
    if (ALLOWED_TAGS.includes(el.tagName)) {
      event.preventDefault();
      event.stopPropagation();

      if (!selectedElements.has(el)) {
        selectedElements.add(el);
        originalContentMap.set(el, el.innerHTML);
        el.style.outline = "2px solid #2ecc71";
        boldElementText(el);
      } else {
        // Unbold if already selected
        selectedElements.delete(el);
        el.innerHTML = originalContentMap.get(el);
        el.style.outline = "";
        originalContentMap.delete(el);
      }
    }
  });

  function boldElementText(el) {
    const text = el.innerText;
    const words = text.split(/(\s+)/);

    const wrapper = document.createElement("div");
    wrapper.className = "bionic-wrapper";
    wrapper.style.display = "inline"; // Keeps layout intact

    words.forEach((word) => {
      if (/^\s+$/.test(word)) {
        wrapper.appendChild(document.createTextNode(word));
      } else {
        const wordDiv = document.createElement("div");
        wordDiv.className = "bionic-word";
        wordDiv.style.display = "inline";
        wordDiv.style.pointerEvents = "none"; // Prevent re-clicks
        wordDiv.style.userSelect = "none"; // Prevent selection
        wordDiv.style.outline = "none";

        if (word.trim().length > 2) {
          const split = Math.ceil(word.length * 0.5);
          wordDiv.innerHTML = `<strong>${word.slice(
            0,
            split
          )}</strong>${word.slice(split)}`;
        } else {
          wordDiv.textContent = word;
        }

        wrapper.appendChild(wordDiv);
      }
    });

    // Replace element content
    el.innerHTML = "";
    el.appendChild(wrapper);
  }

  // Not used anymore but kept in case you need it
  function isInsideStrong(node) {
    while (node) {
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "STRONG") {
        return true;
      }
      node = node.parentNode;
    }
    return false;
  }
}
