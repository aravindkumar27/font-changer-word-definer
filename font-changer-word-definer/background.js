// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GEMINI_API_REQUEST') {
    // Handle the API request
    makeGeminiRequest(request.word)
      .then(response => {
        sendResponse({ success: true, data: response });
      })
      .catch(error => {
        console.error('Background script error:', error);
        sendResponse({ 
          success: false, 
          error: error.message || 'An error occurred while fetching the definition'
        });
      });
    return true; // Required for async response
  }
});

async function makeGeminiRequest(word) {
  try {
    // Get API key from Chrome storage
    const storage = await chrome.storage.local.get('CONFIG');
    const API_KEY = storage.CONFIG?.GEMINI_API_KEY;
    
    if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
      throw new Error('Please set your Gemini API key in the config.js file');
    }

    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    
    const prompt = `
      Provide a comprehensive explanation for the word "${word}" in the following format:
      1. Brief definition (1-2 sentences)
      2. Part of speech
      3. Three example sentences showing different contexts
      4. Any interesting etymology or word origin
      Keep the response concise but informative.
    `;

    console.log('Making API request for word:', word);
    console.log('Using API URL:', API_URL);
    
    try {
      const response = await fetch(`${API_URL}?key=${API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      });

      // Log response status and headers for debugging
      console.log('Response status:', response.status);
      console.log('Response status text:', response.statusText);

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        
        let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            errorMessage += ` - ${errorJson.error.message || errorJson.error}`;
          }
        } catch (parseError) {
          errorMessage += errorText ? ` - ${errorText}` : '';
        }
        
        throw new Error(errorMessage);
      }

      // Try to parse the JSON response
      let data;
      try {
        data = await response.json();
        console.log('API Response data:', data);
      } catch (parseError) {
        console.error('Failed to parse API response:', parseError);
        throw new Error('Invalid JSON response from API');
      }

      if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
        console.error('Unexpected API response format:', data);
        throw new Error('Invalid API response format - missing required fields');
      }

      return data.candidates[0].content.parts[0].text;
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      throw new Error(fetchError.message || 'Failed to fetch response from API');
    }
  } catch (error) {
    console.error('Error in Gemini API request:', error);
    throw error;
  }
} 