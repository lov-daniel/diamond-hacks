(function() {
    // Wait for DOM to load before running the script
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initPracticeQuestions);
    } else {
      initPracticeQuestions();
    }
  
    function initPracticeQuestions() {
      // Prevent duplicate injection
      if (window.practiceQuestionsActivated) return;
      window.practiceQuestionsActivated = true;
  
      // Expose a removal function so disableAll.js can disable this functionality.
      window.removePracticeListeners = function() {
        document.removeEventListener("mouseover", practiceMouseoverHandler);
        document.removeEventListener("mouseout", practiceMouseoutHandler);
        document.removeEventListener("click", practiceClickHandler);
        window.removePracticeListeners = null;
      };
  
      const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];
  
      // --- Markdown Converter ---
      function markdownToHtml(markdown) {
        // Convert headings
        markdown = markdown.replace(/^# (.*)$/gm, '<h1>$1</h1>');
        markdown = markdown.replace(/^## (.*)$/gm, '<h2>$1</h2>');
        markdown = markdown.replace(/^### (.*)$/gm, '<h3>$1</h3>');
        // Convert bold text
        markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        markdown = markdown.replace(/__(.*?)__/g, '<strong>$1</strong>');
        // Convert italic text
        markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>');
        markdown = markdown.replace(/_(.*?)_/g, '<em>$1</em>');
        // Convert links
        markdown = markdown.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
        // Convert new lines to <br> tags
        markdown = markdown.replace(/\n/g, '<br>');
        return markdown;
      }
  
      // --- Hover Handlers ---
      function practiceMouseoverHandler(e) {
        const allowedEl = e.target.closest(ALLOWED_TAGS.join(","));
        if (allowedEl) {
          allowedEl.style.outline = "2px solid #3498db";
          allowedEl.style.cursor = "pointer";
        }
      }
      function practiceMouseoutHandler(e) {
        const allowedEl = e.target.closest(ALLOWED_TAGS.join(","));
        if (allowedEl) {
          allowedEl.style.outline = "";
          allowedEl.style.cursor = "";
        }
      }
  
      // --- Click Handler ---
      async function practiceClickHandler(e) {
        const allowedEl = e.target.closest(ALLOWED_TAGS.join(","));
        if (!allowedEl) return;
        // Only process if the element has at least 5 words.
        if (allowedEl.innerText.trim().split(/\s+/).length < 5) return;
        e.preventDefault();
        e.stopPropagation();
  
        const selectedText = allowedEl.innerText.trim();
  
        try {
          const response = await fetch('http://localhost:4000/prompt/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: selectedText })
          });
          const data = await response.json();
          const questionsHtml = markdownToHtml(data.summary);
          if (data.summary) {
            // Open a popup to display the practice questions.
            const popup = window.open('', 'PracticeQuestions', 'width=600,height=400');
            if (popup && popup.document) {
              popup.document.write(`
                <html>
                  <head>
                    <title>Practice Questions</title>
                    <style>
                      body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        padding: 16px; 
                        background-color: #f9fafb; 
                        color: #333; 
                        font-size: 16px;
                      }
                      h1, h2, h3 { color: #2c3e50; }
                      p { line-height: 1.6; }
                      a { color: #007bff; text-decoration: none; }
                      a:hover { text-decoration: underline; }
                    </style>
                  </head>
                  <body>
                    <h1>Practice Questions</h1>
                    <div>${questionsHtml}</div>
                  </body>
                </html>
              `);
            } else {
              console.error("Popup blocked or failed to open.");
            }
          } else {
            console.error("No practice questions returned:", data);
          }
        } catch (error) {
          console.error("Error during practice questions:", error);
        }
      }
  
      // Attach event listeners for practice questions.
      document.addEventListener("mouseover", practiceMouseoverHandler);
      document.addEventListener("mouseout", practiceMouseoutHandler);
      document.addEventListener("click", practiceClickHandler);
    }
  })();
  