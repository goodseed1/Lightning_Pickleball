import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, Avatar, Button, ActivityIndicator } from 'react-native-paper';
import { useLanguage } from '../../contexts/LanguageContext';
import clubService from '../../services/clubService';

interface Member {
  id: string;
  displayName: string;
  userName?: string;
  userAvatar?: string;
  role: 'member' | 'manager' | 'admin';
  joinedAt?: Date;
}

interface RoleManagementCardProps {
  member: Member;
  isCurrentUserAdmin: boolean;
  onRoleUpdated?: (memberId: string, oldRole: string, newRole: string) => void;
  theme?: 'light' | 'dark';
}

const RoleManagementCardComponent: React.FC<RoleManagementCardProps> = ({
  member,
  isCurrentUserAdmin,
  onRoleUpdated,
  theme = 'dark',
}) => {
  const { t } = useLanguage();
  // 로컬 상태 관리 - 낙관적 업데이트의 핵심
  const [currentRole, setCurrentRole] = useState<'member' | 'manager' | 'admin'>(member.role);
  const [isUpdating, setIsUpdating] = useState(false);

  // 🎨 다크 글래스 스타일 (더 어둡고 미묘한 효과)
  const darkGlassStyle = {
    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
  };

  // 낙관적 업데이트 핸들러 - Hooks must be called before any early return
  const handleOptimisticRoleChange = useCallback(
    async (newRole: 'member' | 'manager') => {
      if (currentRole === newRole || isUpdating) return;

      const previousRole = currentRole;
      setIsUpdating(true);

      // 즉시 UI 업데이트 (낙관적 업데이트)
      setCurrentRole(newRole);

      try {
        // 백그라운드에서 서버와 통신
        await clubService.updateMemberRole(member.id, newRole);

        // 성공 시 부모에게 알림 (현황 업데이트용)
        onRoleUpdated?.(member.id, previousRole, newRole);
      } catch (error) {
        console.error('Failed to update member role:', error);

        // 실패 시 롤백
        setCurrentRole(previousRole);

        // 사용자에게 에러 알림
        Alert.alert(t('roleManagement.error.title'), t('roleManagement.error.message'), [
          { text: t('common.ok'), style: 'default' },
        ]);
      } finally {
        setIsUpdating(false);
      }
    },
    [currentRole, isUpdating, member.id, onRoleUpdated]
  );

  // Early return for admin (after all hooks)
  if (member.role === 'admin') {
    return null;
  }

  const displayName = member.userName || member.displayName;
  const avatarLabel = displayName?.[0] || 'U';

  const getRoleDisplayText = (role: string) => {
    switch (role) {
      case 'manager':
        return t('roleManagement.roles.manager');
      case 'member':
        return t('roleManagement.roles.member');
      default:
        return t('roleManagement.roles.member');
    }
  };

  return (
    <View style={[styles.memberCard, darkGlassStyle]}>
      <View style={styles.memberRow}>
        <View style={styles.memberHeader}>
          {member.userAvatar ? (
            <Avatar.Image size={40} source={{ uri: member.userAvatar }} />
          ) : (
            <Avatar.Text size={40} label={avatarLabel} />
          )}
          <View style={styles.memberInfo}>
            <Text variant='bodyLarge'>{displayName}</Text>
            <Text variant='bodySmall' style={styles.currentRole}>
              {t('roleManagement.currentRole')}: {getRoleDisplayText(currentRole)}
            </Text>
          </View>
        </View>

        {isCurrentUserAdmin && (
          <View style={styles.roleButtons}>
            {isUpdating ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size='small' />
                <Text variant='bodySmall' style={styles.loadingText}>
                  {t('roleManagement.updating')}
                </Text>
              </View>
            ) : (
              <>
                <Button
                  mode={currentRole === 'manager' ? 'contained' : 'outlined'}
                  onPress={() => handleOptimisticRoleChange('manager')}
                  style={styles.roleButton}
                  compact
                  disabled={isUpdating}
                >
                  {t('roleManagement.roles.manager')}
                </Button>
                <Button
                  mode={currentRole === 'member' ? 'contained' : 'outlined'}
                  onPress={() => handleOptimisticRoleChange('member')}
                  style={styles.roleButton}
                  compact
                  disabled={isUpdating}
                >
                  {t('roleManagement.roles.member')}
                </Button>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  memberCard: {
    marginBottom: 12,
    padding: 16,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  currentRole: {
    color: '#666',
    marginTop: 2,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  roleButton: {
    minWidth: 60,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  loadingText: {
    color: '#666',
  },
});

// React.memo로 최적화 - props가 변경되지 않으면 리렌더링하지 않음
export const RoleManagementCard = React.memo(
  RoleManagementCardComponent,
  (prevProps, nextProps) => {
    // 멤버 정보가 동일하고, 관리자 권한이 동일하면 리렌더링하지 않음
    return (
      prevProps.member.id === nextProps.member.id &&
      prevProps.member.role === nextProps.member.role &&
      prevProps.member.displayName === nextProps.member.displayName &&
      prevProps.member.userName === nextProps.member.userName &&
      prevProps.member.userAvatar === nextProps.member.userAvatar &&
      prevProps.isCurrentUserAdmin === nextProps.isCurrentUserAdmin &&
      prevProps.theme === nextProps.theme
    );
  }
);
