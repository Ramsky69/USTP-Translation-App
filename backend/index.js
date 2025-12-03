// backend/index.js
// Simple Express backend that forwards translation requests to Gemini-like API.
// IMPORTANT: Put your real API key in a .env file (GEMINI_API_KEY). Do NOT commit keys.
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const fetch = require('node-fetch');
const { GoogleGenAI } = require('@google/genai');
// The key is picked up automatically from the GEMINI_API_KEY environment variable
const ai = new GoogleGenAI({});
console.log('API Key Loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');
console.log('Key length:', process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.length : 0); // Added length check
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
 // Allow local frontend file to call this API (for local testing).
 res.setHeader('Access-Control-Allow-Origin', '*');
 res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
 res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 next();
});

const API_KEY = process.env.GEMINI_API_KEY;
// If you have an API key (not an OAuth bearer token) you can set USE_API_KEY=true
// to instruct the server to pass the key as a query parameter ( ?key= ) instead
// of using the Authorization: Bearer header. Many Google Cloud endpoints accept
// API keys this way.
const USE_API_KEY = (process.env.USE_API_KEY || '').toLowerCase() === 'true';
const API_BASE = process.env.API_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta';
// Allow overriding the target model from env — some projects / accounts expose
// different model names. Default to gemini-2.5-flash which is a current model name.
const MODEL_NAME = process.env.MODEL_NAME || 'gemini-2.5-flash'; // Recommended model fix

// Local mock mode: set MOCK_TRANSLATION=true to bypass upstream calls
const MOCK_TRANSLATION = (process.env.MOCK_TRANSLATION || '').toLowerCase() === 'true';
if (MOCK_TRANSLATION) console.log('Mock translation mode enabled (no upstream calls)');

if (!API_KEY) {
 console.warn('Warning: GEMINI_API_KEY not found in environment. Create a .env with GEMINI_API_KEY=your_key');
}

app.post('/api/translate', async (req, res) => {
 try {
  const { text, target } = req.body;
  if (!text || !target) return res.status(400).json({ error: 'text and target required' });

  // If mock mode is enabled, return a deterministic mock translation so
  // UI and other flows can be tested without valid upstream credentials.
  if (MOCK_TRANSLATION) {
   const translation = `[[MOCK TRANSLATION to ${target}]] ${text}`;
   return res.json({ translation });
  }

  // Example request body for a Gemini-style generate endpoint.
  // Adjust the structure to match the exact API your account provides.
  const prompt = `Translate the following text into ${target} and keep the tone natural. Return only the translation:\n\n${text}`;

  // Removed unused 'payload' object here
  
  // Build headers and URL depending on whether user wants to pass an
  // API key in the URL or use OAuth2 bearer token in Authorization header.
  const headers = { 'Content-Type': 'application/json' };
  
  const candidateUrls = [
   `${API_BASE}/models/${MODEL_NAME}:generateContent`,
   `${API_BASE}/models/${MODEL_NAME}:generateText`,
   `${API_BASE}/models/${MODEL_NAME}:generate`
  ];
  let url = candidateUrls[0];

  if (API_KEY) {
   // FIX: Use the 'x-goog-api-key' header for the Generative Language API
   headers['x-goog-api-key'] = API_KEY;
  }

  // The Google Generative Language API request body
  const requestBody = {
    contents: [
      { role: "user", parts: [{ text: prompt }] }
    ],
    generationConfig: {
      maxOutputTokens: 800
    }
  };

  // Try each candidate URL until we get a non-404 response or we run out
  // of options.
  let response = null;
  let lastErrorText = null;
  for (const candidate of candidateUrls) {
   url = candidate;
   try {
    response = await fetch(url, {
     method: 'POST',
     headers,
     body: JSON.stringify(requestBody)
    });
   } catch (err) {
    console.error('Fetch error contacting upstream', candidate, err);
    lastErrorText = String(err);
    response = null;
   }

   if (!response) continue; // try next

   // If upstream returns 404, try the next candidate.
   if (response.status === 404) {
    lastErrorText = await response.text().catch(() => '<no body>');
    console.warn('Upstream returned 404 for', candidate, lastErrorText);
    // continue loop to try next candidate
    response = null;
    continue;
   }

   // break if we got a non-404 response
   break;
  }

  if (!response) {
   console.error('All upstream endpoint attempts failed for model:', MODEL_NAME, 'lastError:', lastErrorText);
   return res.status(502).json({ error: `Upstream model not found or unreachable. Tried: ${candidateUrls.join(', ')}` });
  }

    // **CRITICAL FIX: Check for API errors (4xx/5xx) BEFORE trying to parse the successful body.**
    if (!response.ok) { 
        // Attempt to read the error body, using .text() as fallback if .json() fails
        let errorBody = await response.text().catch(() => '<no body received>');
        
        try {
            // Try to parse as JSON if the upstream API sent a JSON error structure
            errorBody = JSON.parse(errorBody);
        } catch (e) {
            // If parsing fails, stick with the raw text
            // The console log below will still catch this
        }
        
        console.error('Upstream API request failed:', response.status, JSON.stringify(errorBody));
        
        // Return a 502 (Bad Gateway) since your proxy failed to get a good response
        return res.status(502).json({ 
            error: `Upstream API failed with status ${response.status}. Check API key and model name.`,
            details: errorBody
        });
    }


  const data = await response.json();
  // Try to extract text from the most common Gemini response shape using optional chaining for safety.
  
  let translation = 
        data?.candidates?.[0]?.content?.parts?.[0]?.text || 
        data?.output?.[0]?.content ||
        data?.choices?.[0]?.text;

  // If the extraction failed for any reason, stringify the whole response for debugging.
  if (!translation) {
        translation = JSON.stringify(data);
    }
    
  res.json({ translation });

 } catch (err) {
  console.error('translate error', err);
  // This catches network errors or issues with your code itself
  res.status(500).json({ error: String(err) });
 }
});

app.listen(port, () => {
 console.log(`Backend listening at http://localhost:${port}`);
});