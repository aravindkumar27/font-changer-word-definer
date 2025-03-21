// Store the API key in Chrome storage
const CONFIG = {
  GEMINI_API_KEY: 'AIzaSyCXv5j7PTJZNy9cr3L-We57jnCpvkqeg60' // Replace with your actual API key
};

// Save to Chrome storage
chrome.storage.local.set({ CONFIG: CONFIG }); 