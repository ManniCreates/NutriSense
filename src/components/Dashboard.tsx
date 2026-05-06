import { useState, useMemo, useEffect } from "react";
import { UserProfile } from "../context/AuthContext";
import { analyzeMeal } from "../services/geminiService";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "./ui";
import { Loader2, Plus, Trash2, Utensils, TrendingDown, Activity, Edit2, X, Check } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays, isSameDay } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from "firebase/firestore";

interface MealEntry {
  id: string;
  userId: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthInsight: string;
  timestamp: number;
}

export function Dashboard({ profile }: { profile: any }) {
  const { user } = useAuth();
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [mealInput, setMealInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressEntries, setProgressEntries] = useState<any[]>([]);

  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editMealInput, setEditMealInput] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "meals"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setMeals(snap.docs.map(d => ({ id: d.id, ...d.data() } as MealEntry)));
    }, error => handleFirestoreError(error, OperationType.LIST, "meals"));
    return () => unsub();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "progress"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setProgressEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.LIST, "progress"));
    return () => unsub();
  }, [user]);

  const latestProgress = useMemo(() => {
    return progressEntries.length > 0 ? progressEntries[progressEntries.length - 1] : null;
  }, [progressEntries]);

  const todayMeals = useMemo(() => {
    const today = new Date().setHours(0, 0, 0, 0);
    return meals.filter(m => new Date(m.timestamp).setHours(0, 0, 0, 0) === today).sort((a,b) => b.timestamp - a.timestamp);
  }, [meals]);

  const totals = useMemo(() => {
    return todayMeals.reduce((acc, curr) => ({
      calories: acc.calories + curr.calories,
      protein: acc.protein + curr.protein,
      carbs: acc.carbs + curr.carbs,
      fat: acc.fat + curr.fat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayMeals]);

  const handleLogMeal = async () => {
    if (!mealInput.trim() || !user) return;
    setIsAnalyzing(true);
    try {
      const insight = await analyzeMeal(
        mealInput, 
        `Goal: ${profile.goal}, Restrictions: ${profile.restrictions}`
      );
      if (insight) {
        const newMeal = {
          userId: user.uid,
          timestamp: Date.now(),
          description: mealInput,
          calories: insight.calories,
          protein: insight.protein,
          carbs: insight.carbs,
          fat: insight.fat,
          healthInsight: insight.healthInsight
        };
        await addDoc(collection(db, "users", user.uid, "meals"), newMeal);
        setMealInput("");
      } else {
        alert("Could not analyze meal. Try being more descriptive.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to record meal.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "meals", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, "meals");
    }
  };

  const startEditing = (meal: MealEntry) => {
    setEditingMealId(meal.id);
    setEditMealInput(meal.description);
  };

  const cancelEditing = () => {
    setEditingMealId(null);
    setEditMealInput("");
  };

  const handleUpdateMeal = async (editedMeal: MealEntry) => {
    if (!editMealInput.trim() || !user) return;
    setIsUpdating(true);
    try {
      const insight = await analyzeMeal(
        editMealInput, 
        `Goal: ${profile.goal}, Restrictions: ${profile.restrictions}`
      );
      if (insight) {
        const updatedEntry = {
          description: editMealInput,
          calories: insight.calories,
          protein: insight.protein,
          carbs: insight.carbs,
          fat: insight.fat,
          healthInsight: insight.healthInsight
        };
        await updateDoc(doc(db, "users", user.uid, "meals", editedMeal.id), updatedEntry);
        cancelEditing();
      } else {
        alert("Could not analyze edited meal. Try being more descriptive.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to analyze meal.");
    } finally {
      setIsUpdating(false);
    }
  };

  const macroData = [
    { name: 'Protein', value: totals.protein * 4, fill: '#43634f' },
    { name: 'Carbs', value: totals.carbs * 4, fill: '#cf4f4f' },
    { name: 'Fat', value: totals.fat * 9, fill: '#e8a838' },
  ];

  const weeklyData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    return days.map(day => {
      const dayMeals = meals.filter(m => isSameDay(new Date(m.timestamp), day));
      return {
        dateFormatted: format(day, "MMM d"),
        protein: Math.round(dayMeals.reduce((sum, m) => sum + m.protein, 0)),
        carbs: Math.round(dayMeals.reduce((sum, m) => sum + m.carbs, 0)),
        fat: Math.round(dayMeals.reduce((sum, m) => sum + m.fat, 0)),
      };
    });
  }, [meals]);


  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-bold tracking-tight text-on-surface">Today's Overview</h2>
        <p className="text-lg text-on-surface-variant">Track your meals and stay on top of your goals.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-5">
        <Card className="col-span-1 border-0 shadow-soft">
          <CardContent className="p-8">
            <div className="font-data text-xs font-semibold uppercase tracking-widest text-outline mb-2 flex justify-between">
              <span>Calories</span>
              <span>{Math.max(0, profile.targetCalories - totals.calories)} left</span>
            </div>
            <div className="font-data text-4xl mt-3 mb-1 text-on-surface">
              {totals.calories}
            </div>
            <div className="font-data text-sm text-outline mb-4">/ {profile.targetCalories} kcal</div>
            <div className="w-full bg-surface-container h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((totals.calories / profile.targetCalories) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 border-0 shadow-soft">
          <CardContent className="p-8">
            <div className="font-data text-xs font-semibold uppercase tracking-widest text-outline mb-2 flex justify-between">
              <span>Protein</span>
              <span>{Math.max(0, profile.targetProtein - Math.round(totals.protein))}g left</span>
            </div>
            <div className="font-data text-4xl mt-3 mb-1 text-primary">
              {Math.round(totals.protein)}<span className="text-2xl">g</span>
            </div>
            <div className="font-data text-sm text-outline mb-4">/ {profile.targetProtein}g</div>
            <div className="w-full bg-primary/10 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((totals.protein / profile.targetProtein) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-0 shadow-soft">
          <CardContent className="p-8">
            <div className="font-data text-xs font-semibold uppercase tracking-widest text-outline mb-2 flex justify-between">
              <span>Carbs</span>
              <span>{Math.max(0, profile.targetCarbs - Math.round(totals.carbs))}g left</span>
            </div>
            <div className="font-data text-4xl mt-3 mb-1 text-berry">
              {Math.round(totals.carbs)}<span className="text-2xl">g</span>
            </div>
            <div className="font-data text-sm text-outline mb-4">/ {profile.targetCarbs}g</div>
            <div className="w-full bg-berry/10 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-berry h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((totals.carbs / profile.targetCarbs) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 border-0 shadow-soft">
          <CardContent className="p-8">
            <div className="font-data text-xs font-semibold uppercase tracking-widest text-outline mb-2 flex justify-between">
              <span>Fat</span>
              <span>{Math.max(0, profile.targetFat - Math.round(totals.fat))}g left</span>
            </div>
            <div className="font-data text-4xl mt-3 mb-1 text-sun">
              {Math.round(totals.fat)}<span className="text-2xl">g</span>
            </div>
            <div className="font-data text-sm text-outline mb-4">/ {profile.targetFat}g</div>
            <div className="w-full bg-sun/20 h-3 rounded-full overflow-hidden">
              <div 
                className="bg-sun h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((totals.fat / profile.targetFat) * 100, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 border-0 shadow-soft">
          <CardContent className="p-8">
            <div className="font-data text-xs font-semibold uppercase tracking-widest text-outline mb-2 flex items-center justify-between">
              <span>Weight & BF</span>
              <TrendingDown className="h-4 w-4 text-outline" />
            </div>
            <div className="font-data text-4xl mt-3 mb-1 text-on-surface">
              {latestProgress?.weight ? `${latestProgress.weight}` : "--"} <span className="text-2xl text-outline">{latestProgress?.weight ? "lbs" : ""}</span>
            </div>
            <div className="font-data text-base text-primary mt-4 font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" /> {latestProgress?.bodyFat ? `${latestProgress.bodyFat}% BF` : "No BF data"}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-0 shadow-soft overflow-hidden">
            <CardHeader className="pb-4 bg-surface-container-lowest border-b border-surface-container">
              <CardTitle className="flex justify-between items-center text-2xl">
                <span>Log a Meal</span>
                <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Utensils className="h-5 w-5 text-primary"/>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-8 pb-8">
              <div className="flex gap-3 flex-col sm:flex-row">
                <Input 
                  placeholder="e.g., A bowl of oatmeal with a sliced banana and almond butter" 
                  value={mealInput}
                  onChange={(e: any) => setMealInput(e.target.value)}
                  onKeyDown={(e: any) => e.key === 'Enter' && handleLogMeal()}
                  className="flex-1"
                />
                <Button onClick={handleLogMeal} disabled={isAnalyzing || !mealInput} className="w-full sm:w-auto">
                  {isAnalyzing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                  {isAnalyzing ? "Analyzing" : "Add Meal"}
                </Button>
              </div>
              <p className="mt-4 text-sm text-outline flex items-center gap-2">
                 <span className="flex h-4 w-4 items-center justify-center rounded-full border border-outline/30 font-data text-[10px]">i</span>
                 Our AI will estimate calories and macros based on your description.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-4 bg-surface-container-lowest border-b border-surface-container">
              <CardTitle className="text-xl">Today's Log</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 relative">
              {todayMeals.length === 0 ? (
                <div className="py-16 text-center text-outline">
                  <p className="text-lg">No meals logged today yet.</p>
                </div>
              ) : (
                <div className="divide-y divide-surface-container">
                  {todayMeals.map(meal => (
                    <div key={meal.id} className="py-6 flex justify-between items-start group">
                      {editingMealId === meal.id ? (
                        <div className="w-full pr-4">
                          <div className="flex gap-3 flex-col sm:flex-row">
                            <Input 
                              value={editMealInput}
                              onChange={(e: any) => setEditMealInput(e.target.value)}
                              autoFocus
                              onKeyDown={(e: any) => e.key === 'Enter' && handleUpdateMeal(meal)}
                              className="flex-1"
                            />
                            <div className="flex gap-2">
                              <Button onClick={() => handleUpdateMeal(meal)} disabled={isUpdating} size="icon">
                                {isUpdating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                              </Button>
                              <Button variant="secondary" onClick={cancelEditing} disabled={isUpdating} size=" icon">
                                <X className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                          <p className="text-sm text-outline mt-3">Editing will re-analyze the meal's nutritional values.</p>
                        </div>
                      ) : (
                        <>
                          <div className="pr-6 flex-1">
                            <p className="text-lg font-semibold text-on-surface leading-tight">{meal.description}</p>
                            <p className="text-base text-on-surface-variant mt-2 leading-relaxed">{meal.healthInsight}</p>
                            <div className="flex flex-wrap gap-4 font-data text-sm tracking-wide font-medium mt-4">
                              <span className="text-on-surface-variant bg-surface px-3 py-1.5 rounded-lg border border-surface-container">
                                {meal.calories} kcal
                              </span>
                              <span className="text-primary bg-primary/10 px-3 py-1.5 rounded-lg">
                                {meal.protein}g P
                              </span>
                              <span className="text-berry bg-berry/10 px-3 py-1.5 rounded-lg">
                                {meal.carbs}g C
                              </span>
                              <span className="text-sun bg-sun/10 px-3 py-1.5 rounded-lg text-[#b47a18]">
                                {meal.fat}g F
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-3 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startEditing(meal)}
                              className="h-10 w-10 flex items-center justify-center rounded-full bg-surface text-outline hover:bg-primary/10 hover:text-primary transition-colors border border-surface-container hover:border-transparent"
                            >
                              <Edit2 className="h-5 w-5" />
                            </button>
                            <button 
                              onClick={() => handleDelete(meal.id)}
                              className="h-10 w-10 flex items-center justify-center rounded-full bg-surface text-outline hover:bg-error/10 hover:text-error transition-colors border border-surface-container hover:border-transparent"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-1">
          <Card className="h-full border-0 shadow-soft">
            <CardHeader className="pb-0 bg-surface-container-lowest">
              <CardTitle className="text-xl">Macronutrient Split</CardTitle>
            </CardHeader>
            <CardContent className="pt-8">
              {totals.calories === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-lg text-outline">
                  Log a meal to see breakdown
                </div>
              ) : (
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroData}
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="value"
                        cornerRadius={100}
                        stroke="none"
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => Math.round(value) + ' kcal'} 
                         contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', padding: '12px 16px', fontWeight: 'bold', fontFamily: 'Lexend' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex flex-col gap-3 mt-4 font-data text-base font-medium max-w-[220px] mx-auto">
                    <div className="flex justify-between text-primary">
                      <span>Protein</span>
                      <span>{Math.round((macroData[0].value / (totals.calories || 1)) * 100)}%</span>
                    </div>
                    <div className="flex justify-between text-berry">
                      <span>Carbs</span>
                      <span>{Math.round((macroData[1].value / (totals.calories || 1)) * 100)}%</span>
                    </div>
                    <div className="flex justify-between text" style={{color: '#b47a18'}}>
                      <span>Fat</span>
                      <span>{Math.round((macroData[2].value / (totals.calories || 1)) * 100)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6 pt-6">
        <h3 className="text-2xl font-bold tracking-tight text-on-surface mb-2">7-Day Macro Trends</h3>
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="font-data text-xs uppercase tracking-widest text-outline font-semibold">Protein (g)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e5" />
                    <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Lexend', fontWeight: 600 }} />
                    <Line type="monotone" dataKey="protein" stroke="#43634f" strokeWidth={4} dot={{ r: 4, fill: '#43634f', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="font-data text-xs uppercase tracking-widest text-outline font-semibold">Carbs (g)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e5" />
                    <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Lexend', fontWeight: 600 }} />
                    <Line type="monotone" dataKey="carbs" stroke="#cf4f4f" strokeWidth={4} dot={{ r: 4, fill: '#cf4f4f', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-soft">
            <CardHeader className="pb-4">
              <CardTitle className="font-data text-xs uppercase tracking-widest text-outline font-semibold">Fat (g)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e5" />
                    <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} domain={[0, 'auto']} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Lexend', fontWeight: 600 }} />
                    <Line type="monotone" dataKey="fat" stroke="#e8a838" strokeWidth={4} dot={{ r: 4, fill: '#e8a838', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
