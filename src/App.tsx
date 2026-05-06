import { useState, useEffect } from "react";
import { Onboarding } from "./components/Onboarding";
import { Dashboard } from "./components/Dashboard";
import { Recipes } from "./components/Recipes";
import { Progress } from "./components/Progress";
import { LayoutDashboard, ChefHat, User, Settings2, TrendingUp, LogOut } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Login } from "./components/Login";
import { logout } from "./services/firebase";

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState<'dashboard' | 'recipes' | 'progress' | 'settings'>('dashboard');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface-container-lowest">Loading...</div>;
  }

  if (!user || !profile) {
    return <Login />;
  }

  if (!profile.isConfigured) {
    return (
      <div className="min-h-screen bg-surface-container-lowest">
        <Onboarding profile={profile} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background font-sans text-on-background">
      {/* Sidebar */}
      <aside className="w-64 bg-surface-container-lowest border-r border-surface-container hidden md:flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-2 font-bold text-2xl text-primary tracking-tight">
            <ChefHat className="h-7 w-7" />
            NutriSense
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <button 
            onClick={() => setTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${tab === 'dashboard' ? 'bg-primary-container/20 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <LayoutDashboard className="h-5 w-5" />
            Dashboard
          </button>
          <button 
            onClick={() => setTab('recipes')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${tab === 'recipes' ? 'bg-primary-container/20 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <ChefHat className="h-5 w-5" />
            AI Recipes
          </button>
          <button 
            onClick={() => setTab('progress')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${tab === 'progress' ? 'bg-primary-container/20 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <TrendingUp className="h-5 w-5" />
            Progress Tracking
          </button>
          <button 
            onClick={() => setTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${tab === 'settings' ? 'bg-primary-container/20 text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'}`}
          >
            <Settings2 className="h-5 w-5" />
            Settings
          </button>
        </nav>

        <div className="p-6 border-t border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 border border-surface-container rounded-full bg-surface-container-low flex items-center justify-center text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-on-surface">Profile</span>
              <span className="text-xs text-on-surface-variant truncate max-w-[100px]">{profile.goal || user.email}</span>
            </div>
          </div>
          <button onClick={logout} className="p-2 text-on-surface-variant hover:text-error hover:bg-surface-container rounded-lg">
             <LogOut className="h-5 w-5" />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:max-w-6xl md:mx-auto w-full">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="bg-surface-container-lowest border-b border-surface-container p-4 md:hidden flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <ChefHat className="h-6 w-6" />
            NutriSense
          </div>
          <select 
             className="text-base border-0 bg-transparent text-on-surface-variant font-medium focus:ring-0"
             value={tab}
             onChange={(e) => setTab(e.target.value as any)}
          >
            <option value="dashboard">Dashboard</option>
            <option value="recipes">AI Recipes</option>
            <option value="progress">Progress Tracking</option>
            <option value="settings">Settings</option>
          </select>
          <button onClick={logout} className="p-2 text-on-surface-variant hover:text-error">
             <LogOut className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 p-6 md:p-10 lg:p-16 overflow-y-auto w-full max-w-full">
          {tab === 'dashboard' && <Dashboard profile={profile} />}
          {tab === 'recipes' && <Recipes profile={profile} />}
          {tab === 'progress' && <Progress profile={profile} />}
          {tab === 'settings' && (
            <div className="max-w-xl mx-auto align-middle">
              <Onboarding profile={profile} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
