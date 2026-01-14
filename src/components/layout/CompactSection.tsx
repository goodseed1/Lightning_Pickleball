import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { List, Divider } from 'react-native-paper';

interface CompactSectionProps {
  title: string;
  description?: string;
  initiallyOpen?: boolean;
  children: React.ReactNode;
  divider?: boolean;
}

export default function CompactSection({
  title,
  description,
  initiallyOpen = false,
  children,
  divider = true,
}: CompactSectionProps) {
  const [expanded, setExpanded] = useState(initiallyOpen);

  return (
    <>
      <List.Accordion
        title={title}
        description={description}
        expanded={expanded}
        onPress={() => setExpanded(!expanded)}
        style={styles.accordion}
        titleStyle={styles.title}
        descriptionStyle={styles.description}
      >
        <View style={styles.content}>{children}</View>
      </List.Accordion>
      {divider && <Divider />}
    </>
  );
}

const styles = StyleSheet.create({
  accordion: {
    backgroundColor: 'white',
    paddingVertical: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 12,
  },
  content: {
    padding: 12,
    paddingTop: 8,
    gap: 12,
  },
});
