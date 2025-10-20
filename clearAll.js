(function() {
  // Clear all bionic text
  const bionicElements = document.querySelectorAll("[data-bionic='true']");
  bionicElements.forEach(el => {
    el.removeAttribute("data-bionic");
    el.style.outline = "";
  });
  
  // Remove all bionic <strong> tags
  const strongs = document.querySelectorAll("strong");
  strongs.forEach(strong => {
    const parent = strong.parentNode;
    while (strong.firstChild) {
      parent.insertBefore(strong.firstChild, strong);
    }
    parent.removeChild(strong);
  });
  
  // Clear all highlighting
  const highlightedWords = document.querySelectorAll("span.highlighted-word");
  highlightedWords.forEach(span => {
    const parent = span.parentNode;
    const textNode = document.createTextNode(span.textContent);
    parent.replaceChild(textNode, span);
  });
  
  // Clear all outlines
  document.querySelectorAll("[style*='outline']").forEach(el => {
    el.style.outline = "";
  });
  
  // Remove any summarization or quiz overlays
  const overlays = document.querySelectorAll("[id^='summarization-'], [id^='quiz-']");
  overlays.forEach(overlay => overlay.remove());
  
  // Normalize text nodes (merge adjacent text nodes)
  document.body.normalize();
  
  console.log("All StudyBox changes have been cleared from the page.");
})();