import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import * as NavigationBar from 'expo-navigation-bar';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
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
    <>
      <StatusBar style="light" backgroundColor={colors.primary} />
      <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.6)',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors[colorScheme ?? 'light'].primary,
          borderTopColor: Colors[colorScheme ?? 'light'].primary,
          borderTopWidth: 1,
          paddingBottom: 28,
          paddingTop: 14,
          height: 84,
          shadowColor: 'rgba(0, 0, 0, 0.04)',
          shadowOffset: {
            width: 0,
            height: -2,
          },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 6,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="feed.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="groups"
        options={{
          title: 'Grupos',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="group.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Criar',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="add.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Carteira',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="wallet.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        }}
      />
    </Tabs>
    </>
  );
}
