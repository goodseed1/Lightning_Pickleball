import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

type Option = { key: string; label: string };
type Props = {
  options: Option[];
  values: string[];
  onChange: (vals: string[]) => void;
  single?: boolean;
};

export default function TwoColChips({ options, values, onChange, single }: Props) {
  const toggle = (key: string) => {
    if (single) {
      onChange([key]);
      return;
    }
    const exists = values.includes(key);
    onChange(exists ? values.filter(v => v !== key) : [...values, key]);
  };

  return (
    <View style={styles.grid}>
      {options.map(opt => (
        <Chip
          key={opt.key}
          selected={values.includes(opt.key)}
          onPress={() => toggle(opt.key)}
          style={styles.chip}
          compact
        >
          {opt.label}
        </Chip>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    width: '48%',
    marginBottom: 8,
  },
});
