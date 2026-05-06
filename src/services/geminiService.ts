export interface NutrientAnalysis {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthInsight: string;
  foodItems: string[];
}

export interface RecipeSuggestion {
  title: string;
  prepTime: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  ingredients: string[];
  instructions: string[];
  reason: string;
}

export async function analyzeMeal(mealDescription: string, userProfileContext: string): Promise<NutrientAnalysis | null> {
  try {
    const res = await fetch('/api/analyze-meal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mealDescription, userProfileContext })
    });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch (error) {
    console.error("Error analyzing meal via API:", error);
    return null;
  }
}

export async function suggestRecipes(userProfileContext: string, currentMacrosContext: string, preferences: string): Promise<RecipeSuggestion[]> {
  try {
    const res = await fetch('/api/suggest-recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userProfileContext, currentMacrosContext, preferences })
    });
    if (!res.ok) throw new Error('API failed');
    return await res.json();
  } catch (error) {
    console.error("Error suggesting recipes via API:", error);
    return [];
  }
}
