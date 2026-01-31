import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

import { getTheme } from '../src/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

export default function RootLayout() {
  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const theme = getTheme(colorScheme);
  const navTheme = {
    ...DefaultTheme,
    dark: colorScheme === 'dark',
    colors: {
      ...DefaultTheme.colors,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      primary: theme.accent,
      notification: theme.accent,
    },
  } as const;

  return (
    <ThemeProvider value={navTheme}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.card },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '600' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="verse/[verseIndex]" options={{ title: 'Verse' }} />
      </Stack>
    </ThemeProvider>
  );
}
