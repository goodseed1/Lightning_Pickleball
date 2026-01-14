/**
 * Quick Action Buttons Component
 * Displays quick action buttons for common AI interactions
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface QuickAction {
  id: string;
  titleKey: string;
  iconName: string;
  action: () => void;
}

interface QuickActionButtonsProps {
  actions: QuickAction[];
  onActionPress: (actionId: string) => void;
}

const QuickActionButtons: React.FC<QuickActionButtonsProps> = ({ actions, onActionPress }) => {
  const { t } = useLanguage();

  const renderActionButton = (action: QuickAction) => (
    <TouchableOpacity
      key={action.id}
      style={styles.actionButton}
      onPress={() => onActionPress(action.id)}
      activeOpacity={0.7}
    >
      <View style={styles.actionIconContainer}>
        <Ionicons name={action.iconName as keyof typeof Ionicons.glyphMap} size={20} color='#2196F3' />
      </View>
      <Text style={styles.actionText}>{t(action.titleKey)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>{t('ai.quickActions.title')}</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsContainer}
      >
        {actions.map(renderActionButton)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    minWidth: 80,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default QuickActionButtons;
