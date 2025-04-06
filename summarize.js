if (!window.summarizeActivated) {
    window.summarizeActivated = true;
    
    // --- Converts Markdown syntax into HTML ---
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
    
    // --- Check if the current page is a PDF ---
    function isPdfPageSync() {
      const url = document.location.href;
      return url.endsWith('.pdf') || document.querySelector('.pdfViewer') !== null;
    }
    
    // --- Extract text from a PDF using PDF.js ---
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
    
    // --- Expose a removal function so disableAll.js can disable summarization ---
    window.removeSummarizeListeners = function() {
      document.removeEventListener("click", summarizeClickHandler);
      window.removeSummarizeListeners = null;
    };
    
    // --- Define the summarization click handler for non-PDF pages ---
    async function summarizeClickHandler(e) {
      const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];
      const el = e.target.closest(ALLOWED_TAGS.join(","));
      if (!el) return;
      const selectedText = el.innerText.trim();
      if (!(ALLOWED_TAGS.includes(el.tagName) && selectedText.split(/\s+/).length >= 5)) return;
      e.preventDefault();
      e.stopPropagation();
    
      try {
        const response = await fetch('https://diamond-hacks.onrender.com/prompt/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: selectedText })
        });
        const data = await response.json();
        const summary = markdownToHtml(data.summary);
        if (data.summary) {
          const popup = window.open('', 'Summary', 'width=400,height=400');
          if (popup && popup.document) {
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
                    h1 { font-size: 24px; color: #2c3e50; }
                    h2, h3 { color: #34495e; }
                    p { line-height: 1.6; }
                    a { color: #007bff; text-decoration: none; }
                    a:hover { text-decoration: underline; }
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
    }
    
    (function() {
      // Wait for DOM to load before running the initialization
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
      } else {
        init();
      }
    
      function init() {
        if (isPdfPageSync()) {
          // Load PDF.js if not already loaded.
          if (!window.pdfjsLib) {
            const script = document.createElement('script');
            script.src = chrome.runtime.getURL('assets/pdf.min.js');
            script.onload = async () => {
              window.pdfjsLib = window['pdfjsLib'];
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('assets/pdf.worker.min.js');
              handleSummarizeForPdf();
            };
            document.head.appendChild(script);
          } else {
            handleSummarizeForPdf();
          }
          return;
        } else {
          // For non-PDF pages, attach the click listener.
          document.addEventListener("click", summarizeClickHandler);
        }
      }
    
      async function handleSummarizeForPdf() {
        try {
          const text = await extractTextFromPdf(document.location.href);
          try {
            const response = await fetch('https://diamond-hacks.onrender.com/prompt/summary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt: text })
            });
            const data = await response.json();
            if (data.summary) {
              const summary = markdownToHtml(data.summary);
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
                          background-color: #f9f9f9; 
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
                        <h2>Summary of Text</h2>
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
            console.error('Error during summarization:', error);
          }
        } catch (err) {
          console.error("Error extracting text:", err);
        }
      }
    })();
  }
  