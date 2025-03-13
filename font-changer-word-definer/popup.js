document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  chrome.storage.local.get(['fontFamily', 'fontSize', 'lineHeight'], function(result) {
    if (result.fontFamily) {
      document.getElementById('fontFamily').value = result.fontFamily;
    }
    if (result.fontSize) {
      document.getElementById('fontSize').value = result.fontSize;
    }
    if (result.lineHeight) {
      document.getElementById('lineHeight').value = result.lineHeight;
    }
  });

  // Handle apply changes button click
  document.getElementById('applyChanges').addEventListener('click', function() {
    const fontSettings = {
      fontFamily: document.getElementById('fontFamily').value,
      fontSize: document.getElementById('fontSize').value,
      lineHeight: document.getElementById('lineHeight').value
    };

    // Save settings
    chrome.storage.local.set(fontSettings);

    // Send message to content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'CHANGE_FONT',
        settings: fontSettings
      });
    });
  });
}); 