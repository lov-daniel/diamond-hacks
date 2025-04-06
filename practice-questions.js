// practice-questions.js

// Converts Markdown syntax into HTML
function markdownToHtml(markdown) {
    // Convert headings (e.g. # Heading 1, ## Heading 2)
    markdown = markdown.replace(/^# (.*)$/gm, '<h1>$1</h1>');
    markdown = markdown.replace(/^## (.*)$/gm, '<h2>$1</h2>');
    markdown = markdown.replace(/^### (.*)$/gm, '<h3>$1</h3>');
    
    // Convert bold text (e.g. **bold** or __bold__)
    markdown = markdown.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    markdown = markdown.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Convert italic text (e.g. *italic* or _italic_)
    markdown = markdown.replace(/\*(.*?)\*/g, '<em>$1</em>');
    markdown = markdown.replace(/_(.*?)_/g, '<em>$1</em>');
    
    // Convert links (e.g. [link text](http://example.com))
    markdown = markdown.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>');
    
    // Convert new lines to <br> tags (simplified)
    markdown = markdown.replace(/\n/g, '<br>');
    
    return markdown;
  }
    
  // Check if the current page is a PDF page
  function isPdfPageSync() {
    const url = document.location.href;
    return url.endsWith('.pdf') || document.querySelector('.pdfViewer') !== null;
  }
    
  // Extract text from a PDF using PDF.js
  async function extractTextFromPdf(pdfUrl) {
    const loadingTask = window.pdfjsLib.getDocument(pdfUrl);
    const pdfDoc = await loadingTask.promise;
    let text = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const content = await page.getTextContent();
      text += content.items.map(item => item.str).join(' ') + '\n';
    }
    return text;
  }
    
  // Helper function that waits for pdfjsLib and GlobalWorkerOptions to be available.
  function waitForPDFLib(timeout = 3000) {
    return new Promise((resolve, reject) => {
      const interval = 100;
      let elapsed = 0;
      const check = () => {
        if (window.pdfjsLib && window.pdfjsLib.GlobalWorkerOptions) {
          resolve();
        } else {
          elapsed += interval;
          if (elapsed < timeout) {
            setTimeout(check, interval);
          } else {
            reject("pdfjsLib or its GlobalWorkerOptions is not available.");
          }
        }
      };
      check();
    });
  }
    
  (function() {
    // Wait for DOM to load before initializing
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initPracticeQuestions);
    } else {
      initPracticeQuestions();
    }
    
    function initPracticeQuestions() {
      // If it's a PDF page, handle practice questions using PDF.js.
      if (isPdfPageSync()) {
        // Load PDF.js if not already loaded.
        if (!window.pdfjsLib) {
          const script = document.createElement('script');
          script.src = chrome.runtime.getURL('assets/pdf.min.js');
          script.onload = async () => {
            window.pdfjsLib = window['pdfjsLib'];
            try {
              await waitForPDFLib();
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('assets/pdf.worker.min.js');
            } catch (err) {
              console.error(err);
              return;
            }
            handlePracticeQuestionsForPdf();
          };
          document.head.appendChild(script);
        } else {
          handlePracticeQuestionsForPdf();
        }
        return;
      }
    
      // For non-PDF pages, set up practice questions via event listeners.
      if (window.practiceQuestionsActivated) return;
      window.practiceQuestionsActivated = true;
    
      // Expose removal function so disableAll.js can disable this functionality.
      window.removePracticeListeners = function() {
        document.removeEventListener("mouseover", practiceMouseoverHandler);
        document.removeEventListener("mouseout", practiceMouseoutHandler);
        document.removeEventListener("click", practiceClickHandler);
        window.removePracticeListeners = null;
      };
    
      const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];
    
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
        if (allowedEl.innerText.trim().split(/\s+/).length < 5) return;
        e.preventDefault();
        e.stopPropagation();
    
        const selectedText = allowedEl.innerText.trim();
    
        try {
          const response = await fetch('https://diamond-hacks.onrender.com/prompt/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: selectedText })
          });
          const data = await response.json();
          const questionsHtml = markdownToHtml(data.summary);
          if (data.summary) {
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
    
      document.addEventListener("mouseover", practiceMouseoverHandler);
      document.addEventListener("mouseout", practiceMouseoutHandler);
      document.addEventListener("click", practiceClickHandler);
    }
    
    async function handlePracticeQuestionsForPdf() {
      try {
        const text = await extractTextFromPdf(document.location.href);
        try {
          const response = await fetch('https://diamond-hacks.onrender.com/prompt/questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: text })
          });
          const data = await response.json();
          const summary = markdownToHtml(data.summary);
          if (data.summary) {
            const popup = window.open('', 'Summary', 'width=600,height=400');
            if (popup && popup.document) {
              popup.document.write(`
                <html>
                  <head>
                    <title>Summary</title>
                    <style>
                      body { 
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                        padding: 16px; 
                        background-color: #f9fafb; 
                        color: #333; 
                        font-size: 16px;
                      }
                      h1 { font-size: 24px; color: #2c3e50; }
                      h2, h3 { color: #34495e; }
                      p { line-height: 1.6; }
                      a { color: #007bff; text-decoration: none; }
                      a:hover { text-decoration: underline; }
                    </style>
                  </head>
                  <body>
                    <div class="summary-container">
                      <h2>Practice Problems</h2>
                      <p>${summary}</p>
                    </div>
                    <div class="popup-footer">
                      <p>Generated by the Gemini API</p>
                    </div>
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
          console.error('Error during practice questions:', error);
        }
      } catch (err) {
        console.error("Error extracting text:", err);
      }
    }
  })();
  