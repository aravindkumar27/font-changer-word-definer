// Create and inject the definition popup
const popup = document.createElement('div');
popup.style.cssText = `
  position: fixed;
  background: white;
  padding: 10px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  max-width: 300px;
  z-index: 10000;
  display: none;
  font-family: Arial, sans-serif;
  font-size: 14px;
  line-height: 1.4;
`;
document.body.appendChild(popup);

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

// Handle text selection for word definition
document.addEventListener('mouseup', async function(e) {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText.length > 0 && selectedText.split(' ').length <= 3) {
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${selectedText}`);
      const data = await response.json();
      
      if (data && data[0]) {
        const meaning = data[0].meanings[0]?.definitions[0]?.definition || 'No definition found';
        
        popup.style.display = 'block';
        popup.style.left = `${e.pageX + 10}px`;
        popup.style.top = `${e.pageY + 10}px`;
        popup.innerHTML = `
          <strong>${selectedText}</strong>
          <hr style="margin: 5px 0">
          ${meaning}
        `;
      }
    } catch (error) {
      console.error('Error fetching definition:', error);
    }
  }
});

// Hide popup when clicking outside
document.addEventListener('mousedown', function(e) {
  if (e.target !== popup && !popup.contains(e.target)) {
    popup.style.display = 'none';
  }
}); 