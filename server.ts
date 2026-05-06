import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // API Route for GenAI meal analysis
  app.post("/api/analyze-meal", async (req, res) => {
    try {
      const { mealDescription, userProfileContext } = req.body;
      const prompt = `
        Analyze the following meal description and estimate its nutritional content. 
        Take into account the user's profile context if relevant: ${userProfileContext}.
        
        Meal Description: "${mealDescription}"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              calories: { type: Type.NUMBER, description: "Estimated total calories" },
              protein: { type: Type.NUMBER, description: "Estimated total protein in grams" },
              carbs: { type: Type.NUMBER, description: "Estimated total carbohydrates in grams" },
              fat: { type: Type.NUMBER, description: "Estimated total fat in grams" },
              healthInsight: { type: Type.STRING, description: "A brief 1-2 sentence health or dietary insight about this meal." },
              foodItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of identified food items in the meal."
              }
            },
            required: ["calories", "protein", "carbs", "fat", "healthInsight", "foodItems"]
          }
        }
      });
      
      const result = JSON.parse(response.text || "{}");
      res.json(result);
    } catch (error: any) {
      console.error('Error analyzing meal:', error);
      res.status(500).json({ error: 'Failed to analyze meal' });
    }
  });

  // API Route for GenAI recipe suggestion
  app.post("/api/suggest-recipes", async (req, res) => {
    try {
      const { userProfileContext, currentMacrosContext, preferences } = req.body;
      const prompt = `
        Based on the following user profile and current daily status, suggest 3 highly personalized, healthy recipes.
        
        User Profile: ${userProfileContext}
        Current Daily Intake Status: ${currentMacrosContext}
        Specific Request/Preference: ${preferences}
        
        The suggestion should help the user meet their goals and respect their dietary restrictions.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                prepTime: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                protein: { type: Type.NUMBER },
                carbs: { type: Type.NUMBER },
                fat: { type: Type.NUMBER },
                ingredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Grocery shopping list style ingredients with amounts." },
                instructions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Step-by-step instructions." },
                reason: { type: Type.STRING, description: "Brief explanation of why this recipe is perfect for them right now." }
              },
              required: ["title", "prepTime", "calories", "protein", "carbs", "fat", "ingredients", "instructions", "reason"]
            }
          }
        }
      });

      const result = JSON.parse(response.text || "[]");
      res.json(result);
    } catch (error: any) {
      console.error('Error suggesting recipes:', error);
      res.status(500).json({ error: 'Failed to suggest recipes' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
