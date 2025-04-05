const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];

if (!window.bionicActivated) {
  window.bionicActivated = true;

  let originalContentMap = new Map();

  // 🧼 Remove any bolded children before bolding a new parent
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

  // Hover outline
  document.addEventListener("mouseover", (e) => {
    if (ALLOWED_TAGS.includes(e.target.tagName)) {
      if (!e.target.closest("[data-bionic='true']")) {
        e.target.style.outline = "2px solid #3498db";
        e.target.style.cursor = "pointer";
      }
    }
  });

  document.addEventListener("mouseout", (e) => {
    e.target.style.outline = "";
    e.target.style.cursor = "";
  });

  document.addEventListener("click", (e) => {
    const el = e.target.closest(ALLOWED_TAGS.join(","));
    if (!el) return;

    // If already bolded, clicking anywhere inside will unbold it
    if (el.closest("[data-bionic='true']")) {
      const boldContainer = el.closest("[data-bionic='true']");
      const original = originalContentMap.get(boldContainer);
      if (original) {
        boldContainer.innerHTML = original;
        boldContainer.removeAttribute("data-bionic");
        originalContentMap.delete(boldContainer);
        boldContainer.style.outline = "";
      }
      return;
    }

    // Only bold if it's not already bolded and has 5+ words
    if (el.innerText.trim().split(/\s+/).length >= 5) {
      e.preventDefault();
      e.stopPropagation();

      // Remove bolded children first
      removeNestedBionic(el);

      // Store the cleaned version before bolding
      originalContentMap.set(el, el.innerHTML);
      applyBionicBolding(el);
      el.dataset.bionic = "true";
      el.style.outline = "2px solid #2ecc71";
    }
  });

  // Bionic bolding function
  function applyBionicBolding(node) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Clean up existing <strong> tags
      const strongs = node.querySelectorAll("strong");
      strongs.forEach((strong) => {
        const parent = strong.parentNode;
        while (strong.firstChild) {
          parent.insertBefore(strong.firstChild, strong);
        }
        parent.removeChild(strong);
      });

      // Recursively apply
      Array.from(node.childNodes).forEach((child) => applyBionicBolding(child));
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
