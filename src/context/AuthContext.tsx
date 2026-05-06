import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db, handleFirestoreError, OperationType } from '../services/firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
  email: string;
  goal: string;
  restrictions: string;
  activity: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  isConfigured: boolean;
  createdAt?: number;
  updatedAt?: number;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // HACKATHON EMERGENCY BYPASS: Instantly log in a mock user
    const mockUser = {
      uid: 'hackathon_guest_user',
      email: 'guest@nutrisense.com',
      displayName: 'Hackathon Judge',
    } as User;
    
    setUser(mockUser);
    // Removed onAuthStateChanged to completely bypass Firebase Auth
  }, []);

  useEffect(() => {
    // HACKATHON EMERGENCY BYPASS: Instantly load a mock profile, bypassing Firestore
    if (user) {
      const mockProfile: UserProfile = {
        email: user.email || '',
        goal: 'Lose Weight',
        restrictions: 'None',
        activity: 'Active',
        isConfigured: true,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      setProfile(mockProfile);
      setLoading(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
