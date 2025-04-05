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

    // Convert new lines to <br> tags (simplified; refine for better paragraph handling)
    markdown = markdown.replace(/\n/g, '<br>');

    return markdown;
}

// Immediately Invoked Function Expression (IIFE) to initialize everything
(function() {
    // Wait for DOM to load before running the script
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }

    function init() {
        // Prevent duplicate injection of the event listeners
        if (window.highlightActivated) return;
        window.highlightActivated = true;

        const ALLOWED_TAGS = ["P", "DIV", "SPAN", "ARTICLE", "SECTION", "LI"];

        // --- Hover Effect: Add a blue border and cursor change on hover ---
        document.addEventListener("mouseover", (e) => {
            if (ALLOWED_TAGS.includes(e.target.tagName)) {
                e.target.style.outline = "2px solid #3498db";  // Blue border on hover
                e.target.style.cursor = "pointer";  // Change cursor to pointer
            }
        });

        document.addEventListener("mouseout", (e) => {
            if (ALLOWED_TAGS.includes(e.target.tagName)) {
                e.target.style.outline = "";  // Remove border when no longer hovered
                e.target.style.cursor = "";  // Reset cursor to default
            }
        });

        // --- Click to Summarize Text ---
        document.addEventListener("click", async (event) => {
            const el = event.target;
            const selectedText = el.innerText.trim();

            // Ensure there's enough text to summarize
            if (ALLOWED_TAGS.includes(el.tagName) && selectedText.split(/\s+/).length >= 5) {
                event.preventDefault();
                event.stopPropagation();

                // Send the selected text to the backend for summarization
                try {
                    const response = await fetch('http://localhost:4000/prompt/questions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ prompt: selectedText })
                    });

                    const data = await response.json();
                    const summary = markdownToHtml(data.summary);

                    if (data.summary) {
                        // Open a popup to display the summary with enhanced spacing
                        const popup = window.open('', 'Summary', 'width=600,height=400');
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
                        console.error('No summary returned:', data);
                    }
                } catch (error) {
                    console.error('Error during summarization:', error);
                }
            }
        });
    }
})();
