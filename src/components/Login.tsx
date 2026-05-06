import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, Button } from './ui';
import { ChefHat } from 'lucide-react';
import { loginWithGoogle } from '../services/firebase';

export const Login: React.FC = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-container-lowest p-4">
      <Card className="w-full max-w-md border-0 shadow-soft">
        <CardHeader className="text-center pb-8 border-b border-surface-container">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 text-primary">
            <ChefHat className="w-12 h-12" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-on-surface">NutriSense</CardTitle>
          <p className="text-on-surface-variant mt-2 text-lg">Your intelligent nutrition assistant</p>
        </CardHeader>
        <CardContent className="pt-8 text-center flex flex-col items-center">
          <Button onClick={loginWithGoogle} className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-on-primary">
            Sign in with Google
          </Button>
          <p className="text-xs text-on-surface-variant mt-6">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
