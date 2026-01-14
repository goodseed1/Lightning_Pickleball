import React from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Card,
  Title,
  Paragraph,
  Button,
  Text as PaperText,
  Chip,
  Surface,
  MD3Theme,
} from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useLanguage } from '../../contexts/LanguageContext';
import { League } from '../../types/league';

interface MemberPreLeagueStatusViewProps {
  league: League;
  applicationStatus: 'not_applied' | 'pending' | 'approved' | 'rejected';
  onApply: () => void;
  isApplying: boolean;
}

export const MemberPreLeagueStatusView: React.FC<MemberPreLeagueStatusViewProps> = ({
  league,
  applicationStatus,
  onApply,
  isApplying,
}) => {
  const { paperTheme: theme } = useTheme();
  const { t } = useLanguage();
  const styles = createStyles(theme);

  const getStatusConfig = () => {
    switch (applicationStatus) {
      case 'pending':
        return {
          icon: 'clock-outline',
          title: t('clubLeaguesTournaments.memberPreLeagueStatus.statusPending'),
          subtitle: t('clubLeaguesTournaments.memberPreLeagueStatus.statusPendingSubtitle'),
          color: theme.colors.outline,
          backgroundColor: theme.colors.surface,
        };
      case 'approved':
        return {
          icon: 'checkmark-circle',
          title: t('clubLeaguesTournaments.memberPreLeagueStatus.statusApproved'),
          subtitle: t('clubLeaguesTournaments.memberPreLeagueStatus.statusApprovedSubtitle'),
          color: theme.colors.primary,
          backgroundColor: theme.colors.primaryContainer,
        };
      case 'rejected':
        return {
          icon: 'close-circle',
          title: t('clubLeaguesTournaments.memberPreLeagueStatus.statusRejected'),
          subtitle: t('clubLeaguesTournaments.memberPreLeagueStatus.statusRejectedSubtitle'),
          color: theme.colors.error,
          backgroundColor: theme.colors.errorContainer,
        };
      default: // 'not_applied'
        return {
          icon: 'person-add-outline',
          title: t('clubLeaguesTournaments.memberPreLeagueStatus.statusNotApplied'),
          subtitle: t('clubLeaguesTournaments.memberPreLeagueStatus.statusNotAppliedSubtitle'),
          color: theme.colors.primary,
          backgroundColor: theme.colors.surface,
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <View style={styles.container}>
      {/* Status Card */}
      <Card style={[styles.statusCard, { backgroundColor: statusConfig.backgroundColor }]}>
        <Card.Content>
          <View style={styles.statusHeader}>
            <Ionicons name={statusConfig.icon} size={48} color={statusConfig.color} />
            <View style={styles.statusText}>
              <Title style={[styles.statusTitle, { color: statusConfig.color }]}>
                {statusConfig.title}
              </Title>
              <Paragraph style={styles.statusSubtitle}>{statusConfig.subtitle}</Paragraph>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* League Info */}
      <Card style={styles.leagueInfoCard}>
        <Card.Content>
          <Title style={styles.sectionTitle}>
            {t('clubLeaguesTournaments.memberPreLeagueStatus.leagueInfo')}
          </Title>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name='calendar-outline' size={20} color={theme.colors.onSurfaceVariant} />
              <View style={styles.infoText}>
                <PaperText style={styles.infoLabel}>
                  {t('clubLeaguesTournaments.memberPreLeagueStatus.period')}
                </PaperText>
                <PaperText style={styles.infoValue}>
                  {league?.startDate?.toDate()?.toLocaleDateString('ko-KR')} -{' '}
                  {league?.endDate?.toDate()?.toLocaleDateString('ko-KR')}
                </PaperText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name='people-outline' size={20} color={theme.colors.onSurfaceVariant} />
              <View style={styles.infoText}>
                <PaperText style={styles.infoLabel}>
                  {t('clubLeaguesTournaments.memberPreLeagueStatus.participantsStatus')}
                </PaperText>
                <PaperText style={styles.infoValue}>
                  {league?.participants?.length || 0} / {league?.settings?.maxParticipants || 16}
                  {t('clubLeaguesTournaments.memberPreLeagueStatus.peopleUnit')}
                </PaperText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name='trophy-outline' size={20} color={theme.colors.onSurfaceVariant} />
              <View style={styles.infoText}>
                <PaperText style={styles.infoLabel}>
                  {t('clubLeaguesTournaments.memberPreLeagueStatus.format')}
                </PaperText>
                <PaperText style={styles.infoValue}>
                  {league?.format ||
                    t('clubLeaguesTournaments.memberPreLeagueStatus.formatTournament')}
                </PaperText>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name='time-outline' size={20} color={theme.colors.onSurfaceVariant} />
              <View style={styles.infoText}>
                <PaperText style={styles.infoLabel}>
                  {t('clubLeaguesTournaments.memberPreLeagueStatus.status')}
                </PaperText>
                <Chip mode='outlined' textStyle={styles.chipText} style={styles.statusChip}>
                  {league?.status === 'open'
                    ? t('clubLeaguesTournaments.memberPreLeagueStatus.statusOpen')
                    : league?.status ||
                      t('clubLeaguesTournaments.memberPreLeagueStatus.statusPreparing')}
                </Chip>
              </View>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Action Section */}
      {applicationStatus === 'not_applied' && (
        <Card style={styles.actionCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              {t('clubLeaguesTournaments.memberPreLeagueStatus.applySection')}
            </Title>
            <Paragraph style={styles.actionDescription}>
              {t('clubLeaguesTournaments.memberPreLeagueStatus.applyDescription')}
            </Paragraph>

            <Button
              mode='contained'
              onPress={onApply}
              loading={isApplying}
              disabled={isApplying || league?.status !== 'open'}
              style={styles.applyButton}
              icon={isApplying ? undefined : 'account-plus'}
            >
              {isApplying
                ? t('clubLeaguesTournaments.memberPreLeagueStatus.applying')
                : t('clubLeaguesTournaments.memberPreLeagueStatus.applyButton')}
            </Button>

            {league?.status !== 'open' && (
              <Surface style={styles.warningContainer}>
                <Ionicons
                  name='information-circle'
                  size={16}
                  color={theme.colors.onSurfaceVariant}
                />
                <PaperText style={styles.warningText}>
                  {t('clubLeaguesTournaments.memberPreLeagueStatus.notOpenWarning')}
                </PaperText>
              </Surface>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Application Status Details */}
      {applicationStatus !== 'not_applied' && (
        <Card style={styles.statusDetailsCard}>
          <Card.Content>
            <Title style={styles.sectionTitle}>
              {t('clubLeaguesTournaments.memberPreLeagueStatus.applicationDetails')}
            </Title>
            <View style={styles.statusDetail}>
              <PaperText style={styles.detailLabel}>
                {t('clubLeaguesTournaments.memberPreLeagueStatus.applicationDate')}
              </PaperText>
              <PaperText style={styles.detailValue}>
                {new Date().toLocaleDateString('ko-KR')} {/* Mock date */}
              </PaperText>
            </View>

            {applicationStatus === 'approved' && (
              <View style={styles.statusDetail}>
                <PaperText style={styles.detailLabel}>
                  {t('clubLeaguesTournaments.memberPreLeagueStatus.approvalDate')}
                </PaperText>
                <PaperText style={styles.detailValue}>
                  {new Date().toLocaleDateString('ko-KR')} {/* Mock date */}
                </PaperText>
              </View>
            )}

            <View style={styles.statusDetail}>
              <PaperText style={styles.detailLabel}>
                {t('clubLeaguesTournaments.memberPreLeagueStatus.currentStatus')}
              </PaperText>
              <Chip
                mode='outlined'
                textStyle={[styles.chipText, { color: statusConfig.color }]}
                style={[styles.statusChip, { borderColor: statusConfig.color }]}
              >
                {statusConfig.title}
              </Chip>
            </View>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const createStyles = (theme: MD3Theme) =>
  StyleSheet.create({
    container: {
      padding: 16,
    },
    statusCard: {
      marginBottom: 16,
      elevation: 4,
    },
    statusHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statusText: {
      marginLeft: 16,
      flex: 1,
    },
    statusTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    statusSubtitle: {
      fontSize: 14,
      opacity: 0.8,
    },
    leagueInfoCard: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: theme.colors.onSurface,
    },
    infoGrid: {
      gap: 16,
    },
    infoItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    infoText: {
      marginLeft: 12,
      flex: 1,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
      marginBottom: 2,
    },
    infoValue: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
    statusChip: {
      alignSelf: 'flex-start',
    },
    chipText: {
      fontSize: 12,
      fontWeight: '500',
    },
    actionCard: {
      marginBottom: 16,
    },
    actionDescription: {
      fontSize: 14,
      lineHeight: 20,
      marginBottom: 16,
      color: theme.colors.onSurfaceVariant,
    },
    applyButton: {
      marginBottom: 12,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.surfaceVariant,
    },
    warningText: {
      marginLeft: 8,
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    statusDetailsCard: {
      marginBottom: 16,
    },
    statusDetail: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.outline,
    },
    detailLabel: {
      fontSize: 14,
      color: theme.colors.onSurfaceVariant,
    },
    detailValue: {
      fontSize: 14,
      color: theme.colors.onSurface,
      fontWeight: '500',
    },
  });
