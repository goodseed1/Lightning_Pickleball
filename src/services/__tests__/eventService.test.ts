/**
 * EventService Tests
 * AI NLU 명령을 위한 동적 이벤트 검색 테스트
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
  limit: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
    fromDate: jest.fn(date => ({ toDate: () => date })),
  },
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => {
    // Don't call callback to avoid authService initialization
    return jest.fn(); // Return unsubscribe function
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
}));

import { searchEvents, SearchFilters } from '../eventService.ts';
import { getDocs } from 'firebase/firestore';

describe('eventService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('searchEvents', () => {
    it('should search events with gameType filter', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ title: 'Doubles Match', gameType: 'doubles' }) },
        { id: '2', data: () => ({ title: 'Mixed Doubles', gameType: 'doubles' }) },
      ];
      (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs, empty: false });

      const filters: SearchFilters = { gameType: 'doubles' };
      const result = await searchEvents(filters);

      expect(result.events).toHaveLength(2);
      expect(result.events[0].gameType).toBe('doubles');
    });

    it('should search events with timeRange filter', async () => {
      // Create a date at 19:00 (7 PM) which is in evening range (17-21)
      const eveningDate = new Date();
      eveningDate.setHours(19, 0, 0, 0);

      const mockDocs = [
        {
          id: '1',
          data: () => ({ title: 'Evening Match', startTime: { toDate: () => eveningDate } }),
        },
      ];
      (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs, empty: false });

      const filters: SearchFilters = { timeRange: 'evening' };
      const result = await searchEvents(filters);

      expect(result.events).toHaveLength(1);
    });

    it('should search events with multiple filters', async () => {
      // Create a date for today at 19:00 (evening)
      const todayEvening = new Date();
      todayEvening.setHours(19, 0, 0, 0);

      const mockDocs = [
        {
          id: '1',
          data: () => ({
            title: 'Singles Today',
            gameType: 'singles',
            startTime: { toDate: () => todayEvening },
          }),
        },
      ];
      (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs, empty: false });

      const filters: SearchFilters = {
        gameType: 'singles',
        date: 'today',
        timeRange: 'evening',
      };
      const result = await searchEvents(filters);

      expect(result.events).toHaveLength(1);
    });

    it('should return empty array when no events found', async () => {
      (getDocs as jest.Mock).mockResolvedValue({ docs: [], empty: true });

      const filters: SearchFilters = { gameType: 'doubles' };
      const result = await searchEvents(filters);

      expect(result.events).toHaveLength(0);
      expect(result.message).toContain('찾지 못했');
    });

    it('should handle errors gracefully', async () => {
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore error'));

      const filters: SearchFilters = { gameType: 'singles' };
      const result = await searchEvents(filters);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should limit results to maxResults parameter', async () => {
      // Mock only returns 5 docs as Firestore limit would do
      const mockDocs = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: `${i}`,
          data: () => ({ title: `Match ${i}`, startTime: { toDate: () => new Date() } }),
        }));
      (getDocs as jest.Mock).mockResolvedValue({ docs: mockDocs, empty: false });

      const filters: SearchFilters = { gameType: 'singles' };
      const result = await searchEvents(filters, { maxResults: 5 });

      expect(result.events.length).toBeLessThanOrEqual(5);
      expect(result.events.length).toBe(5);
    });
  });
});
