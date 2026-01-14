import React from 'react';
import { TextInput, TextInputProps } from 'react-native-paper';

interface FieldProps extends Omit<TextInputProps, 'mode' | 'dense'> {
  // Allow overriding mode and dense if needed
  mode?: 'flat' | 'outlined';
  dense?: boolean;
}

export default function Field(props: FieldProps) {
  const { style, contentStyle, multiline, numberOfLines, ...restProps } = props;

  return (
    <TextInput
      dense
      mode='outlined'
      contentStyle={[
        { paddingVertical: 6 },
        multiline && { minHeight: 60, maxHeight: 120 },
        contentStyle,
      ]}
      style={[multiline && { maxHeight: 120 }, style]}
      multiline={multiline}
      numberOfLines={numberOfLines}
      {...restProps}
    />
  );
}
