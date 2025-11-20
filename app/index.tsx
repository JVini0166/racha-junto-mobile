import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const { session, loading } = useAuth();

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const value = await SecureStore.getItemAsync('hasSeenOnboarding');
      setHasSeenOnboarding(value === 'true');
    } catch (error) {
      setHasSeenOnboarding(false);
    }
  };

  // Aguarda verificação
  if (hasSeenOnboarding === null || loading) {
    return null;
  }

  // Se está autenticado, vai direto para o app
  if (session) {
    return <Redirect href="/(tabs)" />;
  }

  // Se não viu o onboarding, mostra o onboarding
  if (!hasSeenOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  // Caso contrário, mostra a tela de login
  return <Redirect href="/login" />;
}

