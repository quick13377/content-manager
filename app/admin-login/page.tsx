'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Updated import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { LockIcon, UserIcon, Loader2 } from 'lucide-react'; // Add this import

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Now using the correct useRouter
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('adminToken');
    if (token === 'logged_in') {
      router.push('/manage'); // Redirect to manage if already logged in
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call

      // Check if the username and password match
      const validUsers = ['thomas', 'hans', 'najib'];
      if (validUsers.includes(username) && password === username) {
        localStorage.setItem('adminToken', 'logged_in');
        toast({
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
        });
        router.push('/manage'); // Redirect to manage after successful login
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (error) {
      toast({
        title: "Échec de la connexion",
        description: "Nom d'utilisateur ou mot de passe incorrect.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md p-6 space-y-6 rounded-lg border border-gray-300 shadow-lg">
        <CardHeader>
          <h1 className="text-3xl font-bold text-center text-gray-800">Connexion au Gestionnaire</h1>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-gray-600">Nom d'utilisateur</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Entrez votre nom d'utilisateur"
                  className="pl-10 border border-gray-400 focus:border-blue-600 focus:ring focus:ring-blue-300"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-600">Mot de passe</Label>
              <div className="relative">
                <LockIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  className="pl-10 border border-gray-400 focus:border-blue-600 focus:ring focus:ring-blue-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 text-white hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Chargement...
                </div>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              {localStorage.getItem('adminToken') === 'logged_in' ? "Vous êtes déjà connecté." : "Ceci est une page de connexion sécurisée pour les administrateurs."}
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
        </CardFooter>
      </Card>
    </div>
  );
}