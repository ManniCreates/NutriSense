import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { suggestRecipes, RecipeSuggestion } from "../services/geminiService";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "./ui";
import { Loader2, ChefHat, Check, Clock, Flame } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, getDocs } from "firebase/firestore";

const RecipeCard: React.FC<{ recipe: RecipeSuggestion; showSaveBtn?: boolean; onSave?: (r: RecipeSuggestion) => void }> = ({ recipe, showSaveBtn = false, onSave }) => (
  <Card className="flex flex-col overflow-hidden transition-all hover:shadow-soft h-full border-0">
    <div className="bg-surface-container-low p-6 border-b border-surface-container">
      <h4 className="font-bold text-xl text-on-surface leading-tight">{recipe.title}</h4>
      <div className="flex gap-4 font-data text-xs font-semibold text-outline tracking-wide mt-3">
        <div className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-primary"/> {recipe.prepTime}</div>
        <div className="flex items-center gap-1.5 text-sun"><Flame className="w-4 h-4"/> {recipe.calories} kcal</div>
      </div>
    </div>
    <CardContent className="p-6 flex flex-col flex-grow">
      {recipe.reason && (
        <p className="text-sm italic text-on-surface-variant mb-6 pb-6 border-b border-surface-container/50 leading-relaxed font-medium">{recipe.reason}</p>
      )}
      
      <div className="flex gap-2 font-data text-sm tracking-wide font-medium mb-6 bg-surface p-3 rounded-xl border border-surface-container">
         <span className="text-primary flex-1 text-center bg-primary/5 rounded-lg py-1">{recipe.protein}g P</span>
         <span className="text-berry flex-1 text-center border-l-2 border-r-2 border-surface-container bg-berry/5 rounded-lg py-1">{recipe.carbs}g C</span>
         <span className="text-[#b47a18] flex-1 text-center bg-sun/10 rounded-lg py-1">{recipe.fat}g F</span>
      </div>

      <div className="mb-6">
        <h5 className="font-bold text-base mb-3 text-on-surface">Ingredients</h5>
        <ul className="text-base text-on-surface-variant space-y-2 ml-5 list-disc marker:text-primary/40 leading-relaxed">
          {recipe.ingredients.map((ing, i) => <li key={i} className="pl-1 text-sm">{ing}</li>)}
        </ul>
      </div>

      <div className="mb-6 flex-grow">
        <h5 className="font-bold text-base mb-3 text-on-surface">Instructions</h5>
        <ol className="text-base text-on-surface-variant space-y-3 ml-5 list-decimal marker:text-primary font-medium leading-relaxed">
          {recipe.instructions.map((inst, i) => <li key={i} className="pl-2 text-sm font-normal">{inst}</li>)}
        </ol>
      </div>

      {showSaveBtn && onSave && (
        <div className="mt-auto pt-6 border-t border-surface-container">
           <Button variant="outline" className="w-full text-base font-semibold border-2" onClick={() => onSave(recipe)}>
            Save Recipe
          </Button>
        </div>
      )}
    </CardContent>
  </Card>
);

export function Recipes({ profile }: { profile: any }) {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<RecipeSuggestion[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<RecipeSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'suggest' | 'saved'>('suggest');

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "savedRecipes"), orderBy("savedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setSavedRecipes(snap.docs.map(d => d.data() as RecipeSuggestion));
    }, error => handleFirestoreError(error, OperationType.LIST, "savedRecipes"));
    return () => unsub();
  }, [user]);

  const handleSuggest = async () => {
    if (!user) return;
    setIsGenerating(true);
    setSuggestions([]);
    
    // Calculate what's missing today
    const today = new Date().setHours(0, 0, 0, 0);
    let currentCalories = 0;
    try {
      const mealsSnap = await getDocs(collection(db, "users", user.uid, "meals"));
      mealsSnap.docs.forEach(d => {
        const meal = d.data();
        if (new Date(meal.timestamp).setHours(0, 0, 0, 0) === today) {
          currentCalories += meal.calories || 0;
        }
      });
    } catch (error) {
      console.error(error);
    }
    
    const remainingCals = Math.max(0, profile.targetCalories - currentCalories);
    
    const contextStr = `Goal: ${profile.goal}, Restrictions: ${profile.restrictions}`;
    const macroStr = `They have approximately ${remainingCals} calories remaining for today to hit their target.`;
    
    try {
      const results = await suggestRecipes(contextStr, macroStr, preferences || "Anything quick and healthy");
      setSuggestions(results);
    } catch (e) {
      console.error(e);
      alert("Failed to generate recipes.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (recipe: RecipeSuggestion) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "savedRecipes"), {
        ...recipe,
        userId: user.uid,
        savedAt: Date.now()
      });
      alert("Recipe saved!");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "savedRecipes");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">AI Nutritionist</h2>
        <p className="text-slate-500">Get highly personalized recipe suggestions based on your diet and daily progress.</p>
      </div>

      <div className="flex gap-2 border-b border-slate-200 mb-6">
        <button 
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'suggest' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('suggest')}
        >
          Discover New
        </button>
        <button 
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'saved' ? 'border-primary-600 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved Recipes ({savedRecipes.length})
        </button>
      </div>

      {activeTab === 'suggest' && (
        <div className="space-y-6">
          <div className="bg-[#43634f] text-white shadow-soft rounded-2xl overflow-hidden">
            <div className="p-10">
              <div className="max-w-2xl">
                <ChefHat className="w-12 h-12 mb-6 opacity-80" />
                <h3 className="text-3xl font-bold mb-3 tracking-tight">What are you craving?</h3>
                <p className="mb-8 opacity-90 text-lg font-medium">Tell me what you're in the mood for, or just leave it blank and I'll suggest something perfect for right now based on how you've eaten today.</p>
                <div className="flex gap-3 bg-white/10 p-2 rounded-2xl backdrop-blur-sm border border-white/20 flex-col sm:flex-row">
                  <Input 
                    className="border-0 bg-transparent text-white placeholder:text-white/60 focus-visible:ring-0 focus-visible:ring-white/20 px-4 h-14 text-base flex-1"
                    placeholder="e.g. A spicy chicken dish, something with pasta, a light salad..." 
                    value={preferences}
                    onChange={(e: any) => setPreferences(e.target.value)}
                    onKeyDown={(e: any) => e.key === 'Enter' && handleSuggest()}
                    style={{ color: 'white' }}
                  />
                  <Button 
                    variant="secondary" 
                    className="h-14 px-8 rounded-xl font-bold text-[#43634f] bg-white hover:bg-slate-50 w-full sm:w-auto mt-2 sm:mt-0"
                    onClick={handleSuggest} 
                    disabled={isGenerating}
                  >
                    {isGenerating ? <Loader2 className="h-6 w-6 animate-spin" /> : "Suggest"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {isGenerating && (
            <div className="grid md:grid-cols-3 gap-6 pt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse bg-slate-100 rounded-2xl h-[400px]" />
              ))}
            </div>
          )}

          {!isGenerating && suggestions.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {suggestions.map((recipe, index) => (
                <RecipeCard key={index} recipe={recipe} showSaveBtn={true} onSave={handleSave} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-6">
           {savedRecipes.length === 0 ? (
             <div className="text-center py-20 bg-white border border-slate-200 border-dashed rounded-2xl">
               <ChefHat className="h-12 w-12 text-slate-300 mx-auto mb-3" />
               <h3 className="text-lg font-medium text-slate-900 mb-1">No saved recipes yet</h3>
               <p className="text-slate-500">Discover and save recipes to build your personal cookbook.</p>
               <Button className="mt-4" onClick={() => setActiveTab('suggest')}>Find Recipes</Button>
             </div>
           ) : (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
               {savedRecipes.map((recipe, idx) => (
                 <RecipeCard key={idx} recipe={recipe} />
               ))}
             </div>
           )}
        </div>
      )}
    </div>
  );
}
