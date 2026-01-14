/**
 * AnimatedFAB Component
 * Provides consistent pulse animation for FAB buttons across the app
 */

import React from 'react';
import * as Animatable from 'react-native-animatable';
import { FAB, FABProps } from 'react-native-paper';

interface AnimatedFABProps extends FABProps {
  animation?: string;
  duration?: number;
  iterationCount?: number | 'infinite';
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
