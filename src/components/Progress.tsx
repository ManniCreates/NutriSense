import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from "./ui";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Plus, Trash2, TrendingDown, Activity, Ruler } from "lucide-react";
import { format } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { db, handleFirestoreError, OperationType } from "../services/firebase";
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc } from "firebase/firestore";

export function Progress({ profile }: { profile: any }) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<any[]>([]);
  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [waist, setWaist] = useState("");
  const [chest, setChest] = useState("");

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "users", user.uid, "progress"), orderBy("timestamp", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, error => handleFirestoreError(error, OperationType.LIST, "progress"));
    return () => unsub();
  }, [user]);

  const handleLogProgress = async () => {
    if ((!weight && !bodyFat && !waist && !chest) || !user) return;
    
    const newEntry: any = {
      userId: user.uid,
      timestamp: Date.now(),
    };
    if (weight) newEntry.weight = parseFloat(weight);
    if (bodyFat) newEntry.bodyFat = parseFloat(bodyFat);
    if (waist) newEntry.waist = parseFloat(waist);
    if (chest) newEntry.chest = parseFloat(chest);

    try {
      await addDoc(collection(db, "users", user.uid, "progress"), newEntry);
      setWeight("");
      setBodyFat("");
      setWaist("");
      setChest("");
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, "progress");
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, "users", user.uid, "progress", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, "progress");
    }
  };

  const chartData = useMemo(() => {
    return entries.map(e => ({
      ...e,
      dateFormatted: format(new Date(e.timestamp), "MMM d")
    }));
  }, [entries]);

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-3">
        <h2 className="text-3xl font-bold tracking-tight text-on-surface">Progress Tracking</h2>
        <p className="text-lg text-on-surface-variant">Log your body metrics and visualize your journey over time.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        {/* Input Form */}
        <div className="md:col-span-1 rounded-2xl overflow-hidden bg-surface-container-lowest shadow-soft border border-surface-container flex flex-col h-full lg:col-span-1">
          <div className="p-6 border-b border-surface-container bg-surface-container-lowest pb-4">
            <h3 className="font-bold text-xl text-on-surface flex items-center justify-between">
              <span>Log Metrics</span>
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Plus className="h-5 w-5" />
              </div>
            </h3>
          </div>
          <div className="p-6 space-y-6 flex-grow">
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline font-data uppercase tracking-widest flex items-center gap-2">
                 <TrendingDown className="h-4 w-4" /> Weight (lbs/kg)
              </label>
              <Input 
                type="number" step="0.1"
                placeholder="e.g. 150.5" 
                value={weight} onChange={(e: any) => setWeight(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline font-data uppercase tracking-widest flex items-center gap-2">
                 <Activity className="h-4 w-4" /> Body Fat (%)
              </label>
              <Input 
                type="number" step="0.1"
                placeholder="e.g. 15.2" 
                value={bodyFat} onChange={(e: any) => setBodyFat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline font-data uppercase tracking-widest flex items-center gap-2">
                 <Ruler className="h-4 w-4" /> Waist (in/cm)
              </label>
              <Input 
                type="number" step="0.1"
                placeholder="e.g. 32" 
                value={waist} onChange={(e: any) => setWaist(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-outline font-data uppercase tracking-widest flex items-center gap-2">
                 <Ruler className="h-4 w-4" /> Chest (in/cm)
              </label>
              <Input 
                type="number" step="0.1"
                placeholder="e.g. 40" 
                value={chest} onChange={(e: any) => setChest(e.target.value)}
              />
            </div>
          </div>
          <div className="p-6 border-t border-surface-container bg-surface-container-lowest">
             <Button className="w-full h-14 text-lg border-2 border-transparent" onClick={handleLogProgress}>Save Progress</Button>
          </div>
        </div>

        {/* Charts */}
        <div className="md:col-span-2 lg:col-span-3 space-y-8">
           {entries.length === 0 ? (
             <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed border-2 bg-surface-container-low shadow-none">
               <div className="text-center text-outline">
                 <TrendingDown className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p className="font-bold text-xl mb-2">No progress data yet</p>
                 <p className="text-base">Log your first metrics to start visualizing your progress.</p>
               </div>
             </Card>
           ) : (
             <div className="grid gap-6 md:grid-cols-2">
               {/* Weight Chart */}
               <Card className="border-0 shadow-soft">
                 <CardHeader className="pb-4">
                   <CardTitle className="font-data text-xs font-semibold uppercase tracking-widest text-outline">Weight Breakdown</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e5" />
                         <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} dy={10} />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} domain={['auto', 'auto']} />
                         <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Lexend', fontWeight: 600 }}
                         />
                         <Line type="monotone" dataKey="weight" stroke="#43634f" strokeWidth={4} dot={{ r: 4, fill: '#43634f', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7 }} connectNulls />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </CardContent>
               </Card>
               {/* BodyFat Chart */}
               <Card className="border-0 shadow-soft">
                 <CardHeader className="pb-4">
                   <CardTitle className="font-data text-xs font-semibold uppercase tracking-widest text-outline">Body Fat (%)</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="h-[250px] w-full">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e8e8e5" />
                         <XAxis dataKey="dateFormatted" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} dy={10} />
                         <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#727973', fontFamily: 'Lexend' }} domain={['auto', 'auto']} />
                         <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', fontFamily: 'Lexend', fontWeight: 600 }}
                         />
                         <Line type="monotone" dataKey="bodyFat" stroke="#5d9cec" strokeWidth={4} dot={{ r: 4, fill: '#5d9cec', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 7 }} connectNulls />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </CardContent>
               </Card>
             </div>
           )}
           
           {/* History Table */}
           {entries.length > 0 && (
             <Card className="border-0 shadow-soft overflow-hidden">
               <CardHeader className="border-b border-surface-container bg-surface-container-lowest pb-4 pt-6">
                 <CardTitle className="text-xl text-on-surface">History Log</CardTitle>
               </CardHeader>
               <CardContent className="p-0">
                 <div className="overflow-x-auto">
                   <table className="w-full text-base text-left border-collapse">
                     <thead className="text-xs font-data uppercase tracking-widest text-outline bg-surface-container-lowest border-b border-surface-container">
                       <tr>
                         <th className="px-6 py-4 font-semibold">Date</th>
                         <th className="px-6 py-4 font-semibold">Weight</th>
                         <th className="px-6 py-4 font-semibold">Body Fat %</th>
                         <th className="px-6 py-4 font-semibold">Waist</th>
                         <th className="px-6 py-4 font-semibold">Chest</th>
                         <th className="px-6 py-4"></th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-surface-container">
                       {[...entries].reverse().map((entry) => (
                         <tr key={entry.id} className="hover:bg-surface-container-lowest transition-colors group text-on-surface-variant font-medium">
                           <td className="px-6 py-4">{format(new Date(entry.timestamp), "MMM d, yyyy")}</td>
                           <td className="px-6 py-4 font-data">{entry.weight || "-"}</td>
                           <td className="px-6 py-4 font-data text-sky">{entry.bodyFat || "-"}</td>
                           <td className="px-6 py-4 font-data">{entry.waist || "-"}</td>
                           <td className="px-6 py-4 font-data">{entry.chest || "-"}</td>
                           <td className="px-6 py-4 text-right">
                             <button 
                               onClick={() => handleDelete(entry.id)}
                               className="text-outline hover:text-error opacity-0 group-hover:opacity-100 transition-all focus:opacity-100 bg-surface rounded-full p-2"
                             >
                               <Trash2 className="h-5 w-5" />
                             </button>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </CardContent>
             </Card>
           )}
        </div>
      </div>
    </div>
  );
}
