/**
 * 🔄 Match History Migration Screen
 *
 * ONE-TIME USE: Run migration then delete this file
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ActivityIndicator } from 'react-native-paper';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase/config';
import { useLanguage } from '../contexts/LanguageContext';

interface MigrationResult {
  success: boolean;
  message: string;
  stats?: {
    totalUsers: number;
    totalMatches: number;
    globalMatches: number;
    clubMatches: number;
    errors: number;
    errorMessages?: string[];
  };
}

interface ResetResult {
  success: boolean;
  message: string;
  stats?: {
    usersProcessed: number;
    matchHistoryDeleted: number;
    clubMembersReset: number;
    tournamentsProcessed: number;
    tournamentMatchesDeleted: number;
    leaguesProcessed: number;
    leagueMatchesDeleted: number;
    errors: string[];
  };
}

const MigrationScreen = () => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetResult, setResetResult] = useState<ResetResult | null>(null);

  const runMigration = async () => {
    Alert.alert(
      '⚠️ Warning',
      'This will migrate ALL match history data. Run only ONCE. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Run Migration',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            setResult(null);

            try {
              console.log('🔄 Starting migration...');

              const migrateMatchHistory = httpsCallable(functions, 'migrateMatchHistory');
              const response = await migrateMatchHistory({
                secretKey: 'migrate-match-history-2025',
              });

              console.log('✅ Migration completed:', response.data);
              setResult(response.data as MigrationResult);

              Alert.alert(t('migration.successTitle'), t('migration.successMessage'));
            } catch (error: unknown) {
              console.error('❌ Migration failed:', error);
              const errorMessage = error instanceof Error ? error.message : 'Migration failed';
              Alert.alert(t('migration.errorTitle'), errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const runReset = async () => {
    Alert.alert(
      '⚠️ DANGER - Complete Data Reset',
      'This will DELETE ALL match data including:\n\n• All match history\n• All statistics\n• All match records\n• All standings\n\nUser profiles and memberships will be preserved.\n\nThis action CANNOT be undone!\n\nContinue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'DELETE ALL',
          style: 'destructive',
          onPress: async () => {
            setResetLoading(true);
            setResetResult(null);

            try {
              console.log('🗑️ Starting complete reset...');

              const resetAllMatchData = httpsCallable(functions, 'resetAllMatchData');
              const response = await resetAllMatchData({
                secretKey: 'reset-match-data-2025-test',
              });

              console.log('✅ Reset completed:', response.data);
              setResetResult(response.data as ResetResult);

              Alert.alert(t('migration.successTitle'), t('migration.resetSuccessMessage'));
            } catch (error: unknown) {
              console.error('❌ Reset failed:', error);
              const errorMessage = error instanceof Error ? error.message : 'Reset failed';
              Alert.alert(t('migration.errorTitle'), errorMessage);
            } finally {
              setResetLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>🔄 Match History Migration</Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ ONE-TIME USE ONLY</Text>
          <Text style={styles.warningText}>
            This will migrate all existing match_history data to new separated collections:
          </Text>
          <Text style={styles.bullet}>• global_match_history (no clubId)</Text>
          <Text style={styles.bullet}>• club_match_history (has clubId)</Text>
          <Text style={[styles.warningText, { marginTop: 12 }]}>
            Run this ONCE, then delete this screen!
          </Text>
        </View>

        <Button
          mode='contained'
          onPress={runMigration}
          loading={loading}
          disabled={loading}
          style={styles.button}
          buttonColor='#FF5722'
        >
          {loading ? 'Running Migration...' : 'Run Migration'}
        </Button>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' />
            <Text style={styles.loadingText}>Migrating data... This may take a few minutes.</Text>
          </View>
        )}

        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>✅ Migration Complete!</Text>
            <Text style={styles.resultText}>Total Users: {result.stats?.totalUsers || 0}</Text>
            <Text style={styles.resultText}>Total Matches: {result.stats?.totalMatches || 0}</Text>
            <Text style={styles.resultText}>
              Global Matches: {result.stats?.globalMatches || 0}
            </Text>
            <Text style={styles.resultText}>Club Matches: {result.stats?.clubMatches || 0}</Text>
            <Text style={styles.resultText}>Errors: {result.stats?.errors || 0}</Text>

            {result.stats?.errorMessages?.length > 0 && (
              <View style={styles.errorsBox}>
                <Text style={styles.errorsTitle}>Errors:</Text>
                {}
                {result.stats!.errorMessages!.map((msg: string, index: number) => (
                  <Text key={index} style={styles.errorText}>
                    • {msg}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* DANGER ZONE - Complete Data Reset */}
        <View style={[styles.warningBox, { backgroundColor: '#D32F2F', marginTop: 40 }]}>
          <Text style={styles.warningTitle}>⚠️ DANGER ZONE</Text>
          <Text style={styles.warningText}>Reset ALL match data (test environment only):</Text>
          <Text style={styles.bullet}>• Deletes all match history</Text>
          <Text style={styles.bullet}>• Resets all statistics to 0</Text>
          <Text style={styles.bullet}>• Deletes all match records</Text>
          <Text style={styles.bullet}>• Preserves user profiles & memberships</Text>
        </View>

        <Button
          mode='contained'
          onPress={runReset}
          loading={resetLoading}
          disabled={resetLoading}
          style={styles.button}
          buttonColor='#D32F2F'
        >
          {resetLoading ? 'Resetting All Data...' : '🗑️ Reset All Match Data'}
        </Button>

        {resetLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size='large' />
            <Text style={styles.loadingText}>
              Deleting all match data... This may take a few minutes.
            </Text>
          </View>
        )}

        {resetResult && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>✅ Reset Complete!</Text>
            <Text style={styles.resultText}>
              Users Processed: {resetResult.stats?.usersProcessed || 0}
            </Text>
            <Text style={styles.resultText}>
              Club Members Reset: {resetResult.stats?.clubMembersReset || 0}
            </Text>
            <Text style={styles.resultText}>
              Tournaments Processed: {resetResult.stats?.tournamentsProcessed || 0}
            </Text>
            <Text style={styles.resultText}>
              Tournament Matches Deleted: {resetResult.stats?.tournamentMatchesDeleted || 0}
            </Text>
            <Text style={styles.resultText}>
              Leagues Processed: {resetResult.stats?.leaguesProcessed || 0}
            </Text>
            <Text style={styles.resultText}>
              League Matches Deleted: {resetResult.stats?.leagueMatchesDeleted || 0}
            </Text>
            <Text style={styles.resultText}>Errors: {resetResult.stats?.errors?.length || 0}</Text>

            {resetResult.stats?.errors && resetResult.stats.errors.length > 0 && (
              <View style={styles.errorsBox}>
                <Text style={styles.errorsTitle}>Errors:</Text>
                {resetResult.stats.errors.map((msg: string, index: number) => (
                  <Text key={index} style={styles.errorText}>
                    • {msg}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: '#FF5722',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  warningTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
    marginTop: 4,
  },
  button: {
    marginVertical: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 14,
  },
  resultBox: {
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 8,
    marginTop: 20,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorsBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FF5722',
    borderRadius: 4,
  },
  errorsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 4,
  },
});

export default MigrationScreen;
