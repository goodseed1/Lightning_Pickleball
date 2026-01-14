/**
 * Shared Modal Styles for Lightning Pickleball
 * Centralized modal styling to prevent duplication and maintain consistency
 */

import { StyleSheet } from 'react-native';

// Legacy static styles (deprecated - use createModalStyles instead)
export const modalStyles = StyleSheet.create({
  // Base modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Standard modal content container
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    margin: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  // Modal header with title and close button
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },

  // Modal title text
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },

  // Close button in header
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },

  // Modal body content
  modalBody: {
    padding: 20,
  },

  // Action buttons container
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },

  // Primary action button
  modalPrimaryButton: {
    flex: 1,
    borderRadius: 8,
  },

  // Secondary action button
  modalSecondaryButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },

  // Compact modal for smaller content
  modalContentCompact: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '85%',
    maxWidth: 320,
    margin: 20,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // Modal title for compact modals
  modalTitleCompact: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
});

/**
 * Theme-aware modal styles - Use this for all new modal implementations
 * @param theme - Theme object from useTheme hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createModalStyles = (theme: any) => StyleSheet.create({
  // Base modal overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Standard modal content container
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    margin: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },

  // Modal header with title and close button
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },

  // Modal title text
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    flex: 1,
  },

  // Close button in header
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },

  // Modal body content
  modalBody: {
    padding: 20,
  },

  // Action buttons container
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
    gap: 12,
  },

  // Primary action button
  modalPrimaryButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
  },

  // Secondary action button (Cancel/Tertiary)
  modalSecondaryButton: {
    flex: 1,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },

  // Secondary button text
  modalSecondaryButtonText: {
    color: theme.colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '600',
  },

  // Primary button text
  modalPrimaryButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: '600',
  },

  // Compact modal for smaller content
  modalContentCompact: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    width: '85%',
    maxWidth: 320,
    margin: 20,
    padding: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // Modal title for compact modals
  modalTitleCompact: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 16,
    textAlign: 'center',
  },
});
