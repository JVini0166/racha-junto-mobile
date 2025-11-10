import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

import { useTheme } from '@/contexts/ThemeContext';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  try {
    const { colorScheme } = useTheme();
    return colorScheme;
  } catch {
    // Se o ThemeProvider não estiver disponível, usa o padrão do sistema
    const colorScheme = useRNColorScheme();
    if (hasHydrated) {
      return colorScheme;
    }
    return 'light';
  }
}
