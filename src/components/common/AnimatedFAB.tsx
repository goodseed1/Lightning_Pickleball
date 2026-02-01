/**
 * AnimatedFAB Component
 * Provides consistent pulse animation for FAB buttons across the app
 */

import React from 'react';
import * as Animatable from 'react-native-animatable';
import { FAB, FABProps } from 'react-native-paper';

interface AnimatedFABProps {
  animation?: string;
  duration?: number;
  iterationCount?: number | 'infinite';
  // FAB required props
  onPress?: () => void;
  icon: string;
  label?: string;
  style?: object;
  color?: string;
  disabled?: boolean;
  visible?: boolean;
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
  mode?: 'flat' | 'elevated';
  customSize?: number;
  variant?: 'primary' | 'secondary' | 'tertiary' | 'surface';
  [key: string]: unknown;
}

export const AnimatedFAB: React.FC<AnimatedFABProps> = ({
  animation = 'pulse',
  duration = 2000,
  iterationCount = 'infinite',
  ...fabProps
}) => (
  <Animatable.View
    animation={animation}
    duration={duration}
    iterationCount={iterationCount}
    useNativeDriver={true}
  >
    <FAB {...fabProps} />
  </Animatable.View>
);

export default AnimatedFAB;
