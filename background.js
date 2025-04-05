// background.js

async function encryptKey(key) {
    // Implement secure encryption here (e.g., using Web Crypto API)
    // ...
    return encryptedKey;
  }
  
  async function decryptKey(encryptedKey) {
    // Implement secure decryption here
    // ...
    return decryptedKey;
  }
  
  async function storeApiKey(key) {
    const encryptedKey = await encryptKey(key);
    await chrome.storage.local.set({ apiKey: encryptedKey });
  }
  
  async function getApiKey() {
    const result = await chrome.storage.local.get('apiKey');
    if (result.apiKey) {
      return decryptKey(result.apiKey);
    }
    return null;
  }
  
  async function generateText(prompt) {
    const apiKey = await getApiKey();
    if (!apiKey) {
      console.error('API key not found.');
      return;
    }
    const projectId = 'YOUR_PROJECT_ID';
    const model = 'gemini-pro';
  
    const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/us-central1/publishers/google/models/${model}:generateContent`;
  
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    };
  
    const body = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });
  
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: body,
      });
  
      const data = await response.json();
      console.log(data);
      // Send the response back to the content/popup script
    } catch (error) {
      console.error('Error:', error);
    }
  }
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'generateText') {
      generateText(request.prompt);
    } else if (request.action === 'storeKey'){
      storeApiKey(request.key);
    }
  
    return true; // Required for asynchronous sendResponse
  });