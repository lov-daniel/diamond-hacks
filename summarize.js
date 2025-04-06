if (!window.summarizeActivated) {
    window.summarizeActivated = true;
  
    // Store reference to the summarization click handler.
    let clickHandler;
  
    // Expose a removal function so that disableAll.js can disable this functionality.
    window.removeSummarizeListeners = function() {
      document.removeEventListener("click", clickHandler);
      window.removeSummarizeListeners = null;
    };
  
    // Define the summarization click handler.
    clickHandler = async function(e) {
      const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];
      // Get the closest allowed element.
      const el = e.target.closest(ALLOWED_TAGS.join(","));
      if (!el) return;
      const selectedText = el.innerText.trim();
      // Only proceed if the element has at least 5 words.
      if (!(ALLOWED_TAGS.includes(el.tagName) && selectedText.split(/\s+/).length >= 5)) return;
      e.preventDefault();
      e.stopPropagation();
  
      try {
        const response = await fetch('http://localhost:4000/prompt/summary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ prompt: selectedText })
        });
        const data = await response.json();
        const summary = markdownToHtml(data.summary);
        if (data.summary) {
          // Open a popup to display the summary.
          const popup = window.open('', 'Summary', 'width=400,height=400');
          if (popup && popup.document) { // Check if popup is valid
            popup.document.write(`
              <html>
                <head>
                  <title>Summary</title>
                  <style>
                    body { 
                      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                      padding: 16px; 
                      background-color: #f9f9f9; 
                      color: #333; 
                      font-size: 16px;
                    }
                    h1 {
                      font-size: 24px;
                      color: #2c3e50;
                    }
                    h2, h3 {
                      color: #34495e;
                    }
                    p {
                      line-height: 1.6;
                    }
                    a {
                      color: #007bff;
                      text-decoration: none;
                    }
                    a:hover {
                      text-decoration: underline;
                    }
                  </style>
                </head>
                <body>
                  <h1>Summary of Selected Text</h1>
                  <div>${summary}</div>
                </body>
              </html>
            `);
          } else {
            console.error('Popup blocked or failed to open.');
          }
        } else {
          console.error('No summary returned:', data);
        }
      } catch (error) {
        console.error('Error during summarization:', error);
      }
    };
  
    // Attach the summarization click handler.
    document.addEventListener("click", clickHandler);
  
    // --- Markdown Converter Function ---
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
      // Convert new lines to <br>
      markdown = markdown.replace(/\n/g, '<br>');
      return markdown;
    }
  }
  