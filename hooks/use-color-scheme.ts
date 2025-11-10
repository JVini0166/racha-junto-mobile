import { useTheme } from '@/contexts/ThemeContext';
import { useColorScheme as useRNColorScheme } from 'react-native';

export function useColorScheme() {
  try {
    const { colorScheme } = useTheme();
    return colorScheme;
  } catch {
    // Se o ThemeProvider não estiver disponível, usa o padrão do sistema
    return useRNColorScheme() ?? 'light';
  }
}
