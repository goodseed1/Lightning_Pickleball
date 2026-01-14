import React from 'react';
import { Text, TextProps } from 'react-native';

/**
 * Ensures primitive children (string/number) are wrapped in <Text>.
 * Useful as a guard when refactoring components that might render raw strings.
 */
export default function SafeText({
  children,
  ...props
}: TextProps & { children?: React.ReactNode }) {
  if (typeof children === 'string' || typeof children === 'number') {
    return <Text {...props}>{children}</Text>;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Text {...props}>{children as any}</Text>;
}
