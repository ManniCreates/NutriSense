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
    let unsubscribeProfile = () => {};

    const setupProfile = async () => {
      if (user) {
        const docRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(docRef, (snapshot) => {
          if (snapshot.exists()) {
            setProfile(snapshot.data() as UserProfile);
            setLoading(false);
          } else {
            // Document doesn't exist, let's create a base profile
            const baseProfile: UserProfile = {
              email: user.email || '',
              goal: 'Lose Weight',
              restrictions: '',
              activity: 'Sedentary',
              isConfigured: false,
              createdAt: Date.now(),
              updatedAt: Date.now()
            };
            setDoc(docRef, baseProfile)
              .then(() => setProfile(baseProfile))
              .catch(err => handleFirestoreError(err, OperationType.CREATE, 'users'))
              .finally(() => setLoading(false));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'users');
          setLoading(false);
        });
      }
    };

    setupProfile();

    return () => unsubscribeProfile();
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
