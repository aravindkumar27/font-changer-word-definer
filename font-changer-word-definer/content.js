// Create and inject the definition popup with enhanced styling
const popup = document.createElement('div');
popup.style.cssText = `
  position: fixed;
  background: white;
  padding: 15px;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.2);
  max-width: 400px;
  z-index: 10000;
  display: none;
  font-family: Arial, sans-serif;
  font-size: 14px;
  line-height: 1.6;
`;
document.body.appendChild(popup);

// Loading spinner element
const spinner = document.createElement('div');
spinner.style.cssText = `
  display: none;
  width: 30px;
  height: 30px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 10px auto;
`;
popup.appendChild(spinner);

// Add spinning animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

// Handle messages from popup.js
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.type === 'CHANGE_FONT') {
    document.body.style.fontFamily = request.settings.fontFamily;
    document.body.style.fontSize = request.settings.fontSize + 'px';
    document.body.style.lineHeight = request.settings.lineHeight;
  }
});

// Load saved font settings
chrome.storage.local.get(['fontFamily', 'fontSize', 'lineHeight'], function(result) {
  if (result.fontFamily) {
    document.body.style.fontFamily = result.fontFamily;
  }
  if (result.fontSize) {
    document.body.style.fontSize = result.fontSize + 'px';
  }
  if (result.lineHeight) {
    document.body.style.lineHeight = result.lineHeight;
  }
});

async function getGeminiResponse(word) {
  try {
    console.log('Sending request for word:', word);
    const response = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        type: 'GEMINI_API_REQUEST',
        word: word
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Runtime error:', chrome.runtime.lastError);
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          console.error('Empty response received');
          reject(new Error('No response received from the extension'));
          return;
        }
        resolve(response);
      });
    });

    console.log('Received response:', response);

    if (!response.success) {
      throw new Error(response.error || 'Failed to get response from API');
    }

    if (!response.data) {
      throw new Error('No data received in the response');
    }

    return response.data;
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return `Error: ${error.message}`;
  }
}

// Format the Gemini response for display
function formatResponse(response) {
  if (!response) {
    return 'Unable to fetch definition. Please check the console for errors and verify your API key.';
  }
  
  if (response.startsWith('Error:')) {
    return `<div class="error">${response}</div>`;
  }
  
  try {
    // Split the response into sections and format with HTML
    const sections = response.split('\n\n');
    return sections
      .map(section => `<p>${section.trim()}</p>`)
      .join('')
      .replace(/\n/g, '<br>');
  } catch (error) {
    console.error('Error formatting response:', error);
    return 'Error formatting the definition. Please try again.';
  }
}

// Handle text selection for word definition
document.addEventListener('mouseup', async function(e) {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText.length > 0 && selectedText.split(' ').length <= 3) {
    // Show popup with loading state
    popup.style.display = 'block';
    popup.style.left = `${e.pageX + 10}px`;
    popup.style.top = `${e.pageY + 10}px`;
    
    // Clear previous content and show loading state
    popup.innerHTML = `
      <strong>${selectedText}</strong>
      <hr style="margin: 10px 0">
      <div id="loading">
        <div style="text-align: center;">Loading definition...</div>
        ${spinner.outerHTML}
      </div>
    `;

    try {
      // Get enhanced definition from Gemini
      const geminiResponse = await getGeminiResponse(selectedText);
      const formattedResponse = formatResponse(geminiResponse);
      
      // Update popup with response
      popup.innerHTML = `
        <strong>${selectedText}</strong>
        <hr style="margin: 10px 0">
        <div class="definition-content">
          ${formattedResponse}
        </div>
      `;
    } catch (error) {
      console.error('Error in word definition handler:', error);
      popup.innerHTML = `
        <strong>${selectedText}</strong>
        <hr style="margin: 10px 0">
        <div class="error">
          ${error.message || 'Unable to fetch definition. Please try again.'}
        </div>
      `;
    }
  }
});

// Hide popup when clicking outside
document.addEventListener('mousedown', function(e) {
  if (e.target !== popup && !popup.contains(e.target)) {
    popup.style.display = 'none';
  }
});

// Update the test function
async function testApiKey() {
  const storage = await chrome.storage.local.get('CONFIG');
  const API_KEY = storage.CONFIG?.GEMINI_API_KEY;
  
  if (!API_KEY) {
    console.error('❌ API key not found in storage');
    return;
  }
  
  console.log('Testing API key...');
  console.log('API Key format:', API_KEY.startsWith('AIza') ? '✅ Correct prefix' : '❌ Wrong prefix');
  
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GEMINI_API_REQUEST',
      word: 'test'
    });

    if (response.success) {
      console.log('✅ API connection successful!');
      console.log('Response:', response.data);
    } else {
      console.error('❌ API Error:', response.error);
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
}

// Call the test function when the content script loads
testApiKey(); 