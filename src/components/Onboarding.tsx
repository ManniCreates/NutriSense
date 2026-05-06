import { useState } from "react";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "./ui";
import { useAuth } from "../context/AuthContext";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../services/firebase";

export function Onboarding({ profile }: { profile: any }) {
  const { user } = useAuth();
  const [goal, setGoal] = useState(profile.goal || "Lose weight");
  const [restrictions, setRestrictions] = useState(profile.restrictions || "");
  const [activity, setActivity] = useState(profile.activity || "Sedentary");
  const [calories, setCalories] = useState(profile.targetCalories?.toString() || "2000");

  const handleSave = async () => {
    if (!user) return;
    
    const cal = parseInt(calories) || 2000;

    const updated = {
      goal,
      restrictions,
      activity,
      targetCalories: cal,
      targetProtein: Math.round((cal) * 0.3 / 4), // Rough estimate macros
      targetCarbs: Math.round((cal) * 0.4 / 4),
      targetFat: Math.round((cal) * 0.3 / 9),
      isConfigured: true,
      updatedAt: Date.now()
    };

    try {
      await updateDoc(doc(db, "users", user.uid), updated);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "users");
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-surface-container-lowest p-2 border-0 shadow-soft">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-on-surface">Welcome to NutriSense</CardTitle>
          <p className="text-base text-on-surface-variant font-medium">Let's set up your profile so we can personalize our recommendations.</p>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline font-data uppercase tracking-widest">Primary Goal</label>
            <select
              className="flex h-12 w-full rounded-xl border border-surface-container bg-surface px-4 py-2 text-base font-medium text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all mb-4"
              value={goal}
              onChange={e => setGoal(e.target.value)}
            >
              <option>Eat healthier</option>
              <option>Lose weight</option>
              <option>Gain muscle</option>
              <option>Maintain weight</option>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-bold text-outline font-data uppercase tracking-widest">Dietary Restrictions & Allergies</label>
            <Input 
              placeholder="e.g. Vegan, Gluten-free, Peanut allergy" 
              value={restrictions}
              onChange={(e: any) => setRestrictions(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-outline font-data uppercase tracking-widest">Activity Level</label>
            <select
              className="flex h-12 w-full rounded-xl border border-surface-container bg-surface px-4 py-2 text-base font-medium text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-all mb-4"
              value={activity}
              onChange={e => setActivity(e.target.value)}
            >
              <option>Sedentary</option>
              <option>Lightly Active</option>
              <option>Moderate</option>
              <option>Very Active</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-outline font-data uppercase tracking-widest flex items-center justify-between">
              <span>Daily Calorie Target</span>
              <span className="text-outline font-normal normal-case tracking-normal">Optional</span>
            </label>
            <Input 
              type="number"
              value={calories}
              onChange={(e: any) => setCalories(e.target.value)}
            />
            <p className="text-sm font-medium text-on-surface-variant pt-2">We'll automatically balance your macros.</p>
          </div>

          <Button className="w-full h-14 text-lg border-2 mt-8" onClick={handleSave}>Complete Setup</Button>
        </CardContent>
      </Card>
    </div>
  );
}
