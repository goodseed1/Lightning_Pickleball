/**
 * AnimatedListItem Component
 * Provides consistent staggered fade-in animation for list items across the app
 */

import React, { ReactNode } from 'react';
import * as Animatable from 'react-native-animatable';

interface AnimatedListItemProps {
  children: ReactNode;
  index: number;
  animation?: string;
  duration?: number;
  delay?: number;
}

export const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  index,
  animation = 'fadeInUp',
  duration = 500,
  delay = 100,
}) => (
  <Animatable.View
    animation={animation}
    duration={duration}
    delay={index * delay}
    useNativeDriver={true}
  >
    {children}
  </Animatable.View>
);

export default AnimatedListItem;
