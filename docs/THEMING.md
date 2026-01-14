# Lightning Pickleball Theme System Documentation

_Project Midnight - Phase 2: Enhanced Theme Architecture_

## 🌙 Overview

The Lightning Pickleball Theme System provides a comprehensive, professional-grade theming solution with full dark mode support. Built on React Native Paper with custom Lightning Pickleball branding, it offers seamless theme switching, persistent user preferences, and platform-optimized styling.

## 🚀 Quick Start

### Using the Theme Hook

```tsx
import { useTheme } from '../hooks/useTheme';

const MyComponent = () => {
  const { theme, themePreference, setThemePreference, isLoading } = useTheme();

  return (
    <View style={{ backgroundColor: theme === 'dark' ? '#121212' : '#FFFFFF' }}>
      <Text>Current theme: {theme}</Text>
      <Button onPress={() => setThemePreference('dark')}>Switch to Dark Mode</Button>
    </View>
  );
};
```

### Accessing Lightning Pickleball Colors

```tsx
import { LightningPickleballBrandColors, LightningPickleballDarkColors } from '../theme/colors';

// Light mode colors
const lightColors = LightningPickleballBrandColors;
console.log(lightColors.primary); // '#1976D2' (Lightning Blue)
console.log(lightColors.pickleball); // '#7CB342' (Pickleball Green)

// Dark mode colors
const darkColors = LightningPickleballDarkColors;
console.log(darkColors.primary); // '#42A5F5' (Lighter Lightning Blue)
console.log(darkColors.pickleball); // '#9CCC65' (Softer Pickleball Green)
```

## 📁 Architecture

### File Structure

```
src/theme/
├── index.ts        # Main theme system exports
├── colors.ts       # Centralized color definitions
└── navigation.ts   # React Navigation themes

src/hooks/
└── useTheme.ts     # Theme context hook

src/contexts/
└── ThemeContext.tsx # Theme provider

src/types/
└── theme.ts        # TypeScript definitions
```

## 🎨 Color System

### Lightning Pickleball Brand Colors

#### Light Mode Palette

```tsx
export const LightningPickleballBrandColors = {
  primary: '#1976D2', // Lightning Pickleball Blue
  secondary: '#FF6B35', // Pickleball Orange
  accent: '#00BCD4', // Electric Cyan
  success: '#4CAF50', // Success Green
  warning: '#FF9800', // Warning Amber
  error: '#F44336', // Error Red
  pickleball: '#7CB342', // Pickleball Court Green
  lightning: '#FFD700', // Lightning Gold
};
```

#### Dark Mode Palette

```tsx
export const LightningPickleballDarkColors = {
  primary: '#42A5F5', // Lighter Lightning Blue
  secondary: '#FF8A50', // Softer Pickleball Orange
  accent: '#26C6DA', // Brighter Electric Cyan
  success: '#66BB6A', // Softer Success Green
  warning: '#FFB74D', // Softer Warning Amber
  error: '#EF5350', // Softer Error Red
  pickleball: '#9CCC65', // Lighter Pickleball Green
  lightning: '#FFE082', // Softer Lightning Gold
};
```

### Platform-Specific Colors

The system automatically adjusts colors based on the platform:

- **iOS**: Uses iOS Human Interface Guidelines colors
- **Android**: Uses Material Design 3 colors

## 🛠️ Theme API

### Theme Context

```tsx
interface ThemeContextType {
  theme: ThemeMode; // 'light' | 'dark'
  themePreference: ThemePreference; // 'light' | 'dark' | 'system'
  setThemePreference: (preference: ThemePreference) => Promise<void>;
  isLoading: boolean; // Theme loading state
}
```

### Main Theme Functions

```tsx
// Get complete theme (Paper + Navigation)
const completeTheme = getCompleteTheme('dark');
const { paper, navigation } = completeTheme;

// Get individual themes
const paperTheme = getLightningPickleballTheme('dark');
const navTheme = getLightningPickleballNavigationTheme(true);

// Create custom theme variant
const customTheme = createCustomTheme('light', {
  primary: '#FF5722',
  secondary: '#2196F3',
});
```

## 🎯 Components

### Creating Theme-Aware Components

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { LightningPickleballBrandColors, LightningPickleballDarkColors } from '../theme/colors';

const MyThemedComponent = () => {
  const { theme } = useTheme();

  // Dynamic color selection
  const colors = theme === 'dark' ? LightningPickleballDarkColors : LightningPickleballBrandColors;

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.primary,
      padding: 16,
    },
    text: {
      color: theme === 'dark' ? '#FFFFFF' : '#000000',
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Lightning Pickleball Component</Text>
    </View>
  );
};
```

### Using Paper Components

React Native Paper components automatically use the theme:

```tsx
import { Button, Card, Surface } from 'react-native-paper';

const PaperComponents = () => (
  <Card>
    <Card.Content>
      <Button mode='contained'>Lightning Pickleball Button</Button>
    </Card.Content>
  </Card>
);
```

## 🧭 Navigation Theming

### Standard Navigation Theme

```tsx
import { NavigationContainer } from '@react-navigation/native';
import { getLightningPickleballNavigationTheme } from '../theme/navigation';

const App = () => {
  const { theme } = useTheme();
  const navigationTheme = getLightningPickleballNavigationTheme(theme === 'dark');

  return (
    <NavigationContainer theme={navigationTheme}>{/* Your navigation stack */}</NavigationContainer>
  );
};
```

### Specialized Navigation Themes

```tsx
import {
  getTournamentNavigationTheme,
  getElectricNavigationTheme,
  getNavigationThemeForSection,
} from '../theme/navigation';

// Tournament-specific theme
const tournamentTheme = getTournamentNavigationTheme(isDark);

// Electric/Lightning match theme
const electricTheme = getElectricNavigationTheme(isDark);

// Section-based theme selection
const clubTheme = getNavigationThemeForSection('club', isDark);
```

## 💾 Persistence

Theme preferences are automatically saved to AsyncStorage:

```tsx
// User preference is saved automatically
await setThemePreference('dark'); // Saves to '@lightning_pickleball_theme_preference'

// On app restart, preference is loaded automatically
// No additional code required
```

## 🎪 Theme Variants

### Available Variants

1. **Standard**: Default Lightning Pickleball branding
2. **Tournament**: Pickleball green accents for competitions
3. **Electric**: Cyan accents for lightning matches
4. **Club**: Orange accents for club features

### Using Variants

```tsx
import { NavigationThemeVariants } from '../theme/navigation';

const tournamentTheme = NavigationThemeVariants.tournament.dark;
const electricTheme = NavigationThemeVariants.electric.light;
```

## 🔧 Customization

### Custom Colors

```tsx
import { withOpacity } from '../theme/colors';

const customColors = {
  customBlue: '#2196F3',
  customBlueTransparent: withOpacity('#2196F3', 0.5),
  customGradient: ['#FF5722', '#FF9800'], // For gradient components
};
```

### Custom Theme Creation

```tsx
const myCustomTheme = createCustomNavigationTheme(false, {
  primary: '#E91E63',
  background: '#FCE4EC',
  card: '#F8BBD9',
});
```

## 📱 Platform Considerations

### iOS Specific

- Uses true black backgrounds in dark mode (`#000000`)
- System font family (`System`)
- iOS-style shadows and elevation

### Android Specific

- Uses Material Design dark backgrounds (`#121212`)
- Roboto font family
- Material Design elevation system

## ⚡ Performance

### Optimization Tips

1. **Memoize Dynamic Styles**: Use `useMemo` for computed styles
2. **Avoid Inline Styles**: Create StyleSheet objects
3. **Use Theme Constants**: Reference theme values instead of hardcoding

```tsx
const optimizedStyles = useMemo(
  () =>
    StyleSheet.create({
      container: {
        backgroundColor: theme === 'dark' ? colors.dark : colors.light,
      },
    }),
  [theme, colors]
);
```

## 🧪 Testing

### Theme Testing Utilities

```tsx
import { validateNavigationTheme } from '../theme/navigation';

// Validate theme completeness
const isValid = validateNavigationTheme(myTheme);
console.log('Theme is valid:', isValid);
```

### Testing Components

```tsx
import { render } from '@testing-library/react-native';
import { ThemeProvider } from '../contexts/ThemeContext';

const renderWithTheme = (component, theme = 'light') => {
  return render(<ThemeProvider initialTheme={theme}>{component}</ThemeProvider>);
};
```

## 🚨 Migration Guide

### From Phase 1 to Phase 2

#### Old Way (Phase 1)

```tsx
import { getTheme } from '../theme';

const theme = getTheme('dark');
```

#### New Way (Phase 2)

```tsx
import { getLightningPickleballTheme, getCompleteTheme } from '../theme';

// For Paper theme only
const paperTheme = getLightningPickleballTheme('dark');

// For complete theme system (recommended)
const { paper, navigation } = getCompleteTheme('dark');
```

### Backward Compatibility

All Phase 1 APIs remain available with deprecation warnings:

```tsx
// ✅ Still works (deprecated)
import { getTheme, lightTheme, darkTheme } from '../theme';

// ✅ New recommended approach
import { getLightningPickleballTheme, LightningPickleballLightTheme } from '../theme';
```

## 🎯 Best Practices

### Do's ✅

1. **Use the useTheme hook** for theme-aware components
2. **Reference theme colors** instead of hardcoding
3. **Test both light and dark modes** during development
4. **Use semantic color names** (e.g., `onSurface` instead of `black`)
5. **Implement proper contrast ratios** for accessibility

### Don'ts ❌

1. **Don't hardcode colors** in components
2. **Don't ignore platform differences** in styling
3. **Don't forget to test theme switching** functionality
4. **Don't mix theme systems** (stick to Lightning Pickleball themes)
5. **Don't bypass the theme context** for color access

## 🌟 Examples

Check out the example components in `src/components/examples/ThemedCard.tsx` for:

- ✨ Basic theme-aware components
- 🎨 Dynamic styling based on theme
- 🔄 Theme switching demonstrations
- 📱 Platform-optimized styling
- 🎯 Lightning Pickleball branding integration

## 🤝 Contributing

When adding new themed components:

1. Use the `useTheme` hook for theme access
2. Support both light and dark modes
3. Follow Lightning Pickleball color guidelines
4. Test on both iOS and Android
5. Document component usage patterns

---

_For more examples and advanced usage, see the `/src/components/examples/` directory._
