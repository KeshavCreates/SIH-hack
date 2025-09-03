// This is a Vercel Serverless Function that acts as a secure proxy to the Gemini API.
// Vercel automatically detects files in the /api directory as serverless functions.
import fetch from 'node-fetch';
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

export default async function handler(req, res) {
    // CORS headers for all requests
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Only allow POST requests
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    upload.single('document')(req, res, async function(err) {
        // CORS headers for responses inside multer callback
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (err) {
            return res.status(400).json({ error: 'File upload failed' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Convert uploaded file to base64
        const imageBuffer = req.file.buffer;
        const imageBase64 = imageBuffer.toString('base64');
        // Detect mime type (default to jpeg if not present)
        const mimeType = req.file.mimetype || 'image/jpeg';

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error('API key is not set in environment variables.');
            return res.status(500).json({ error: 'Server Error: API key not configured.' });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const systemPrompt = `You are an AI legal assistant named TermsGuard. Analyze legal document images. 
        1. Provide a concise, easy-to-understand summary of the document's purpose.
        2. List key details like clauses, responsibilities, and deadlines.
        3. Highlight potential risks (fees, ambiguous language). For each risk, you MUST classify its severity as 'Low', 'Medium', or 'High'.
        
        You MUST respond ONLY with a valid JSON object with this exact structure:
        {
          "summary": "string",
          "keyDetails": ["string"],
          "risks": [{"risk": "string", "severity": "'Low'|'Medium'|'High'"}]
        }`;

        const payload = {
            systemInstruction: { parts: [{ text: systemPrompt }] },
            contents: [{
                parts: [
                    { text: "Analyze the document image and provide the analysis in the required JSON format." },
                    { inlineData: { mimeType: mimeType, data: imageBase64 } }
                ]
            }],
            generationConfig: { responseMimeType: "application/json" }
        };
        
        try {
            const geminiResponse = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await geminiResponse.json();

            if (!geminiResponse.ok) {
                console.error('Gemini API Error:', result);
                const errorMessage = result?.error?.message || 'An unknown error occurred with the AI service.';
                return res.status(geminiResponse.status).json({ error: errorMessage });
            }

            const candidate = result.candidates?.[0];
            const jsonText = candidate?.content?.parts?.[0]?.text;

            if (jsonText) {
                res.setHeader('Content-Type', 'application/json');
                return res.status(200).send(jsonText); // Send the raw JSON string from Gemini
            } else {
                console.error('Invalid response structure from Gemini API:', result);
                return res.status(500).json({ error: 'Invalid or empty response structure from the AI service.' });
            }
        } catch (error) {
            console.error('Error in Vercel function:', error);
            return res.status(500).json({ error: error.message || 'An internal server error occurred.' });
        }
    });
}
