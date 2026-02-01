/**
 * 📝 LPR Level Detail Modal
 *
 * Shows detailed information about an LPR (Lightning Pickleball Rating) level
 *
 * UI 표시: "LPR" (Lightning Pickleball Rating) - 사용자에게 보이는 텍스트
 * Props: "ltr: number" (1-10) - integer values
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { lightningPickleballDarkTheme } from '../../theme';
import { LPR_LEVELS, getLocalizedText } from '../../constants/lpr';

// ============================================================================
// Type Definitions
// ============================================================================

interface LtrLevelDetailModalProps {
  visible: boolean;
  ltr: number;
  onClose: () => void;
}

// ============================================================================
// Main Component
// ============================================================================

const LtrLevelDetailModal: React.FC<LtrLevelDetailModalProps> = ({ visible, ltr, onClose }) => {
  const { currentLanguage, t } = useLanguage();
  const themeColors = lightningPickleballDarkTheme.colors;

  const levelDetails = LPR_LEVELS.find(level => level.value === ltr);

  if (!levelDetails) return null;

  return (
    <Modal visible={visible} animationType='slide' transparent={true} onRequestClose={onClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: themeColors.surface }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.onSurface }]}>
              {getLocalizedText(levelDetails.label, currentLanguage)}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name='close' size={24} color={themeColors.onSurface} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>
                {t('ltrLevelDetail.description')}
              </Text>
              <Text style={[styles.sectionText, { color: themeColors.onSurface }]}>
                {getLocalizedText(levelDetails.description, currentLanguage)}
              </Text>
            </View>

            {/* Skills */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name='ellipse' size={20} color='#FFD700' />
                <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>
                  {t('ltrLevelDetail.skills')}
                </Text>
              </View>
              <Text style={[styles.sectionText, { color: themeColors.onSurfaceVariant }]}>
                {getLocalizedText(levelDetails.skills, currentLanguage)}
              </Text>
            </View>

            {/* Tactics */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name='analytics' size={20} color='#FFD700' />
                <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>
                  {t('ltrLevelDetail.tactics')}
                </Text>
              </View>
              <Text style={[styles.sectionText, { color: themeColors.onSurfaceVariant }]}>
                {getLocalizedText(levelDetails.tactics, currentLanguage)}
              </Text>
            </View>

            {/* Experience */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name='time' size={20} color='#FFD700' />
                <Text style={[styles.sectionTitle, { color: '#FFD700' }]}>
                  {t('ltrLevelDetail.experience')}
                </Text>
              </View>
              <Text style={[styles.sectionText, { color: themeColors.onSurfaceVariant }]}>
                {getLocalizedText(levelDetails.experience, currentLanguage)}
              </Text>
            </View>
          </ScrollView>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeActionButton} onPress={onClose}>
            <Text style={styles.closeActionButtonText}>{t('ltrLevelDetail.close')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 14,
    lineHeight: 22,
  },
  closeActionButton: {
    marginHorizontal: 20,
    marginTop: 12,
    paddingVertical: 16,
    backgroundColor: '#FFD700',
    borderRadius: 12,
    alignItems: 'center',
  },
  closeActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
});

export default LtrLevelDetailModal;
