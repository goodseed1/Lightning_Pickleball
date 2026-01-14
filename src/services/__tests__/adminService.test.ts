/**
 * AdminService Tests
 * TDD for real-time user feedback management system
 */

// Firebase mock - MUST be before imports
jest.mock('../../firebase/config', () => ({
  db: {},
  auth: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(() => ({ id: 'mock-doc-ref' })),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  onSnapshot: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
  },
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

import {
  subscribeToAllFeedback,
  updateFeedbackStatus,
  getFeedbackStats,
  FeedbackFilters,
} from '../adminService';
import { onSnapshot, updateDoc, getDocs } from 'firebase/firestore';

describe('adminService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribeToAllFeedback', () => {
    it('should subscribe to all feedback and call callback with data', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const mockFeedback = [
        {
          id: '1',
          data: () => ({
            userId: 'user1',
            userEmail: 'test@test.com',
            userName: 'Test User',
            type: 'bug',
            title: 'App crashes on login',
            description: 'The app crashes when I try to login',
            status: 'new',
            priority: 'high',
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ];

      (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
        callback({ docs: mockFeedback });
        return mockUnsubscribe;
      });

      const unsubscribe = subscribeToAllFeedback(mockCallback);

      expect(onSnapshot).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: '1',
          type: 'bug',
          status: 'new',
          priority: 'high',
        }),
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should filter feedback by status', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const filters: FeedbackFilters = { status: 'new' };
      subscribeToAllFeedback(mockCallback, filters);

      expect(onSnapshot).toHaveBeenCalled();
    });

    it('should filter feedback by priority', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const filters: FeedbackFilters = { priority: 'critical' };
      subscribeToAllFeedback(mockCallback, filters);

      expect(onSnapshot).toHaveBeenCalled();
    });

    it('should filter feedback by type', () => {
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();

      (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

      const filters: FeedbackFilters = { type: 'bug' };
      subscribeToAllFeedback(mockCallback, filters);

      expect(onSnapshot).toHaveBeenCalled();
    });

    it('should handle errors gracefully', () => {
      const mockCallback = jest.fn();
      const mockError = new Error('Firestore error');

      (onSnapshot as jest.Mock).mockImplementation((query, callback, errorCallback) => {
        errorCallback(mockError);
        return jest.fn();
      });

      subscribeToAllFeedback(mockCallback);

      expect(onSnapshot).toHaveBeenCalled();
    });
  });

  describe('updateFeedbackStatus', () => {
    it('should update feedback status and updatedAt', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateFeedbackStatus('feedback1', 'in_progress');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'in_progress',
          updatedAt: expect.anything(),
        })
      );
    });

    it('should set resolvedAt when status is resolved', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateFeedbackStatus('feedback1', 'resolved');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'resolved',
          updatedAt: expect.anything(),
          resolvedAt: expect.anything(),
        })
      );
    });

    it('should add admin notes if provided', async () => {
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      await updateFeedbackStatus('feedback1', 'in_progress', 'Investigating the issue');

      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'in_progress',
          adminNotes: 'Investigating the issue',
        })
      );
    });

    it('should throw error if update fails', async () => {
      (updateDoc as jest.Mock).mockRejectedValue(new Error('Update failed'));

      await expect(updateFeedbackStatus('feedback1', 'resolved')).rejects.toThrow('Update failed');
    });
  });

  describe('getFeedbackStats', () => {
    it('should return stats grouped by status, type, and priority', async () => {
      const mockDocs = [
        {
          id: '1',
          data: () => ({ status: 'new', type: 'bug', priority: 'high' }),
        },
        {
          id: '2',
          data: () => ({ status: 'new', type: 'feature', priority: 'medium' }),
        },
        {
          id: '3',
          data: () => ({ status: 'in_progress', type: 'bug', priority: 'critical' }),
        },
        {
          id: '4',
          data: () => ({ status: 'resolved', type: 'praise', priority: 'low' }),
        },
      ];

      (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs });

      const stats = await getFeedbackStats();

      expect(stats.byStatus).toEqual({
        new: 2,
        in_progress: 1,
        resolved: 1,
      });

      expect(stats.byType).toEqual({
        bug: 2,
        feature: 1,
        complaint: 0,
        praise: 1,
        other: 0,
      });

      expect(stats.byPriority).toEqual({
        high: 1,
        medium: 1,
        critical: 1,
        low: 1,
      });
    });

    it('should return zero counts when no feedback exists', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [] });

      const stats = await getFeedbackStats();

      expect(stats.byStatus).toEqual({
        new: 0,
        in_progress: 0,
        resolved: 0,
      });

      expect(stats.byType).toEqual({
        bug: 0,
        feature: 0,
        complaint: 0,
        praise: 0,
        other: 0,
      });

      expect(stats.byPriority).toEqual({
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      });
    });

    it('should handle errors gracefully', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      await expect(getFeedbackStats()).rejects.toThrow('Firestore error');
    });
  });
});
