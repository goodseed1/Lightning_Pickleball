import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type AdminNotification = {
  id: string;
  type: string; // e.g., 'club_applications'
  clubId?: string;
  clubName?: string;
  count?: number;
  priority?: 'low' | 'medium' | 'high';
  title: string;
  description?: string;
  actionRequired?: boolean;
  createdAt?: Date;
  data?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
  };
};

type Props = {
  notification: AdminNotification;
  onPress?: () => void;
  onDismiss?: () => void;
};

const priorityColor = (p?: AdminNotification['priority']) => {
  switch (p) {
    case 'high':
      return '#e53935';
    case 'medium':
      return '#fb8c00';
    default:
      return '#43a047';
  }
};

const AdminNotificationCard: React.FC<Props> = ({ notification, onPress, onDismiss }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole='button'
    >
      <View style={[styles.iconWrap, { backgroundColor: priorityColor(notification.priority) }]}>
        <Ionicons name='alert-circle' size={20} color='#fff' />
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        {!!notification.description && (
          <Text style={styles.desc} numberOfLines={2}>
            {notification.description}
          </Text>
        )}

        {/* Optional inline meta such as club name / count */}
        {(notification.clubName || typeof notification.count === 'number') && (
          <View style={styles.metaRow}>
            {notification.clubName ? (
              <Text style={styles.metaText} numberOfLines={1}>
                {notification.clubName}
              </Text>
            ) : null}
            {typeof notification.count === 'number' ? (
              <Text style={styles.metaBadge}>{notification.count}</Text>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {onDismiss ? (
          <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name='close' size={18} color='#9e9e9e' />
          </TouchableOpacity>
        ) : null}
        <Ionicons name='chevron-forward' size={20} color='#9e9e9e' />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', color: '#222' },
  desc: { fontSize: 13, color: '#666', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 8 },
  metaText: { fontSize: 12, color: '#777', flexShrink: 1 },
  metaBadge: {
    fontSize: 11,
    color: '#fff',
    backgroundColor: '#1976d2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actions: { flexDirection: 'row', alignItems: 'center', marginLeft: 8, gap: 8 },
});

export default AdminNotificationCard;
