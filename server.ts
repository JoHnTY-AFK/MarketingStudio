import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, Modality } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (apiKey) {
    console.log('GEMINI_API_KEY found (length:', apiKey.length, ')');
  } else {
    console.warn('GEMINI_API_KEY NOT FOUND in environment variables');
  }
  const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // Health Check for Cloud Run
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // API Routes
  app.post('/api/ai/annotate', async (req, res) => {
    if (!ai) {
      console.error('API call failed: AI not initialized (missing API key)');
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const { prompt, imageBase64 } = req.body;
    try {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      const cleanPrompt = prompt.replace(/^(annotate|find)\s+/i, '').trim();

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: `Find the "${cleanPrompt}" in this image. If it is visible, return its bounding box as a JSON array of 4 numbers [ymin, xmin, ymax, xmax] where each number is between 0 and 1000. For example: [250, 300, 450, 500]. If the feature is NOT clearly visible in the image, return an empty array []. Return ONLY the JSON array, nothing else.` }
        ],
        config: { temperature: 0.1 }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Annotate Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/refine-brief', async (req, res) => {
    if (!ai) {
      console.error('API call failed: AI not initialized (missing API key)');
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const { projectDetails } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: `You are a Creative Director for high-end product commercials (think Apple, Nike, Tesla).
        Convert the following product details into a concise, energetic, and creative cinematic brief.
        
        Product Details: "${projectDetails}"
        
        The brief should be around 2-3 sentences. It should specify:
        1. The target audience and mood: "A sleek, energetic 15-second product showcase for a young tech-savvy audience. Use an upbeat vibe."
        2. Key features to highlight: "The logo and the screen."
        3. The overall visual vibe: "Sleek, modern, and high-energy."
        4. MANDATORY: Explicitly state that the video must be exactly 15 seconds long.
        5. MANDATORY: Request a dramatic "Reveal" shot to start the film.
        
        Return ONLY the brief text.`,
        config: { temperature: 0.7 }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Refine Brief Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/generate-film-plan', async (req, res) => {
    if (!ai) {
      console.error('API call failed: AI not initialized (missing API key)');
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const { brief, availableFocalPoints, systemInstruction } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: brief,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              backdropPreset: { type: Type.STRING },
              backdropPrompt: { type: Type.STRING },
              presets: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                    animatedProp: { type: Type.STRING },
                    backgroundMusic: { type: Type.STRING },
                    narrationPrompt: { type: Type.STRING },
                    params: {
                      type: Type.OBJECT,
                      properties: {
                        speed: { type: Type.NUMBER },
                        direction: { type: Type.STRING },
                        heightOffset: { type: Type.NUMBER },
                        zoomLevel: { type: Type.NUMBER },
                        focalPointLabel: { type: Type.STRING }
                      }
                    }
                  },
                  required: ['name', 'duration']
                }
              }
            },
            required: ['presets']
          }
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Generate Film Plan Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/generate-narration', async (req, res) => {
    if (!ai) {
      console.error('API call failed: AI not initialized (missing API key)');
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const { prompt } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Puck' },
              },
          },
        },
      });
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      res.json({ base64Audio });
    } catch (error: any) {
      console.error('Generate Narration Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/generate-image', async (req, res) => {
    if (!ai) {
      console.error('API call failed: AI not initialized (missing API key)');
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const { prompt } = req.body;
    try {
      const fullPrompt = `Equirectangular 3D panorama of ${prompt}. Seamless, photorealistic, 360 degree HDRI environment map, perfectly mapped for a sphere.`;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: fullPrompt }] },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
            imageSize: "2K"
          }
        },
      });
      let base64Image = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Image = part.inlineData.data;
          break;
        }
      }
      res.json({ base64Image });
    } catch (error: any) {
      console.error('Generate Image Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/ai/parse-director-prompt', async (req, res) => {
    if (!ai) {
      console.error('API call failed: AI not initialized (missing API key)');
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }
    const { prompt, systemInstruction } = req.body;
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-preview',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              actions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING },
                    params: {
                      type: Type.OBJECT,
                      properties: {
                        northPoleAngle: { type: Type.NUMBER },
                        targetFeatures: { type: Type.ARRAY, items: { type: Type.STRING } },
                        stepDistance: { type: Type.NUMBER },
                        fillRatio: { type: Type.NUMBER },
                        alignment: { type: Type.STRING },
                        dispersionMin: { type: Type.NUMBER },
                        dispersionMax: { type: Type.NUMBER },
                        lightIndex: { type: Type.NUMBER },
                        distanceMode: { type: Type.STRING },
                        verticalOffset: { type: Type.STRING },
                        horizontalOffset: { type: Type.STRING },
                        type: { type: Type.STRING },
                        intensity: { type: Type.NUMBER }
                      }
                    }
                  },
                  required: ["action", "params"]
                }
              }
            },
            required: ['actions']
          }
        }
      });
      res.json({ text: response.text });
    } catch (error: any) {
      console.error('Parse Director Prompt Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, server.js is in dist/
    // Static files are also in dist/
    // So if __dirname is dist/, we serve from __dirname
    const distPath = path.resolve(__dirname);
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${port}`);
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
  });
}

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();
