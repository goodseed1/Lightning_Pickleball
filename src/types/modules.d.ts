// Type declarations for external modules without types

declare module '@react-native-picker/picker' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  export interface PickerProps<T = string | number> {
    selectedValue?: T;
    onValueChange?: (itemValue: T, itemIndex: number) => void;
    style?: ViewStyle;
    enabled?: boolean;
    mode?: 'dialog' | 'dropdown';
    prompt?: string;
    testID?: string;
    children?: React.ReactNode;
    itemStyle?: TextStyle;
    dropdownIconColor?: string;
    dropdownIconRippleColor?: string;
    placeholder?: string;
    numberOfLines?: number;
    selectionColor?: string;
  }

  export interface PickerItemProps<T = string | number> {
    label: string;
    value: T;
    color?: string;
    enabled?: boolean;
    style?: TextStyle;
  }

  export class Picker<T = string | number> extends Component<PickerProps<T>> {
    static Item: React.ComponentType<PickerItemProps<T>>;
  }

  export default Picker;
}
