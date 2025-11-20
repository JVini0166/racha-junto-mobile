import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import * as NavigationBar from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { useColorScheme } from '@/hooks/use-color-scheme';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Sempre usa o azul do tema claro para a barra de status
  const primaryBlue = Colors.light.primary;

  useEffect(() => {
    // Configura a barra de status e navegação do Android para azul (visual imersivo)
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(primaryBlue).catch(() => {
        // Ignora erros se não conseguir configurar
      });
      // Usa setStyle que funciona com edge-to-edge habilitado
      NavigationBar.setStyle('dark');
    }
  }, [primaryBlue]);

  return (
    <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="pool/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="create-pool" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" backgroundColor={primaryBlue} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}
