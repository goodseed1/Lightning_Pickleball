import {
  collection,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  setDoc,
  // updateDoc, // Reserved for future fee updates
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';

interface RequiredPayment {
  id: string;
  clubId: string;
  clubName: string;
  type: 'join' | 'monthly' | 'yearly';
  amount: number;
  currency: 'USD' | 'KRW';
  dueDate: Date;
  isOverdue: boolean;
  gracePeriodDays: number;
}

interface PaymentHistoryItem {
  id: string;
  clubId: string;
  clubName: string;
  type: 'join' | 'monthly' | 'yearly';
  amount: number;
  currency: 'USD' | 'KRW';
  paidDate: Date;
  method: string;
  status: 'completed' | 'pending' | 'failed';
}

interface FeeStatus {
  required: RequiredPayment[];
  history: PaymentHistoryItem[];
}

class FeeService {
  /**
   * Get fee status for a specific user across all their clubs
   * @param userId - User ID to get fee status for
   * @returns Promise with required payments and payment history
   */
  async getMyFeeStatus(userId: string): Promise<FeeStatus> {
    try {
      console.log('🔍 Getting fee status for user:', userId);

      // 1. Get all clubs where the user is a member
      const userClubs = await this.getUserClubs(userId);
      console.log(
        '📋 User is member of clubs:',
        userClubs.map(c => c.name)
      );

      // 2. For each club, get dues settings and user's payment status
      const required: RequiredPayment[] = [];
      const history: PaymentHistoryItem[] = [];

      for (const club of userClubs) {
        // Get club dues settings
        const duesSettings = await this.getClubDuesSettings(club.id);

        if (duesSettings) {
          // Check what payments are required for this user
          const requiredForClub = await this.getRequiredPaymentsForClub(
            userId,
            club.id,
            club.name,
            duesSettings
          );
          required.push(...requiredForClub);

          // Get payment history for this club
          const historyForClub = await this.getPaymentHistoryForClub(userId, club.id, club.name);
          history.push(...historyForClub);
        }
      }

      // Sort required payments by due date (overdue first)
      required.sort((a, b) => {
        if (a.isOverdue && !b.isOverdue) return -1;
        if (!a.isOverdue && b.isOverdue) return 1;
        return a.dueDate.getTime() - b.dueDate.getTime();
      });

      // Sort history by date (most recent first)
      history.sort((a, b) => b.paidDate.getTime() - a.paidDate.getTime());

      console.log(`✅ Found ${required.length} required payments, ${history.length} history items`);

      return { required, history };
    } catch (error) {
      console.error('❌ Error getting fee status:', error);
      throw error;
    }
  }

  /**
   * Get all clubs where the user is a member
   */
  private async getUserClubs(userId: string) {
    // 🎯 [UNIFICATION] Use clubMembers instead of club_memberships
    const q = query(
      collection(db, 'clubMembers'),
      where('userId', '==', userId),
      where('status', '==', 'active')
    );

    const snapshot = await getDocs(q);
    const clubIds = snapshot.docs.map(doc => doc.data().clubId);

    // Get club details
    const clubs = [];
    for (const clubId of clubIds) {
      const clubDoc = await getDoc(doc(db, 'pickleball_clubs', clubId));
      if (clubDoc.exists()) {
        clubs.push({
          id: clubId,
          name: clubDoc.data().name || 'Unknown Club',
          ...clubDoc.data(),
        });
      }
    }

    return clubs;
  }

  /**
   * Get dues settings for a specific club
   */
  private async getClubDuesSettings(clubId: string) {
    try {
      const settingsDoc = await getDoc(doc(db, 'club_dues_settings', clubId));

      if (!settingsDoc.exists()) {
        console.log(`No dues settings found for club: ${clubId}`);
        return null;
      }

      return settingsDoc.data();
    } catch (error) {
      console.error('Error getting club dues settings:', error);
      return null;
    }
  }

  /**
   * Get required payments for a user in a specific club
   */
  private async getRequiredPaymentsForClub(
    userId: string,
    clubId: string,
    clubName: string,
    duesSettings: Record<string, unknown>
  ): Promise<RequiredPayment[]> {
    const required: RequiredPayment[] = [];
    const now = new Date();

    try {
      // Check if user has paid join fee
      const joinFeeRecord = await this.getPaymentRecord(userId, clubId, 'join');
      if (!joinFeeRecord && ((duesSettings.joinFee as number) || 0) > 0) {
        // Join fee is required immediately upon joining
        const membershipDoc = await this.getMembershipRecord(userId, clubId);
        const joinDate = membershipDoc?.joinedAt?.toDate() || now;

        required.push({
          id: `${clubId}_join`,
          clubId,
          clubName,
          type: 'join',
          amount: (duesSettings.joinFee as number) || 0,
          currency: ((duesSettings.currency as string) || 'USD') as 'USD' | 'KRW',
          dueDate: joinDate,
          isOverdue: now > joinDate,
          gracePeriodDays: (duesSettings.gracePeriodDays as number) || 7,
        });
      }

      // Check monthly/yearly fees based on dues type
      if (duesSettings.duesType === 'monthly') {
        const currentPeriod = this.getCurrentMonthPeriod();
        const monthlyRecord = await this.getPaymentRecord(userId, clubId, 'monthly', currentPeriod);

        if (!monthlyRecord) {
          const dueDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            (duesSettings.dueDay as number) || 1
          );
          if (dueDate < now) {
            dueDate.setMonth(dueDate.getMonth() + 1); // Next month
          }

          required.push({
            id: `${clubId}_monthly_${currentPeriod}`,
            clubId,
            clubName,
            type: 'monthly',
            amount: (duesSettings.amount as number) || 0,
            currency: ((duesSettings.currency as string) || 'USD') as 'USD' | 'KRW',
            dueDate,
            isOverdue: now > dueDate,
            gracePeriodDays: (duesSettings.gracePeriodDays as number) || 7,
          });
        }
      } else if (duesSettings.duesType === 'yearly') {
        const currentYear = now.getFullYear();
        const yearlyRecord = await this.getPaymentRecord(
          userId,
          clubId,
          'yearly',
          currentYear.toString()
        );

        if (!yearlyRecord) {
          const dueDate = new Date(currentYear, 0, (duesSettings.dueDay as number) || 1); // January 1st
          if (dueDate < now) {
            dueDate.setFullYear(dueDate.getFullYear() + 1); // Next year
          }

          required.push({
            id: `${clubId}_yearly_${currentYear}`,
            clubId,
            clubName,
            type: 'yearly',
            amount: (duesSettings.amount as number) || 0,
            currency: ((duesSettings.currency as string) || 'USD') as 'USD' | 'KRW',
            dueDate,
            isOverdue: now > dueDate,
            gracePeriodDays: (duesSettings.gracePeriodDays as number) || 30,
          });
        }
      }
    } catch (error) {
      console.error('Error getting required payments for club:', clubId, error);
    }

    return required;
  }

  /**
   * Get payment history for a user in a specific club
   */
  private async getPaymentHistoryForClub(
    userId: string,
    clubId: string,
    clubName: string
  ): Promise<PaymentHistoryItem[]> {
    const history: PaymentHistoryItem[] = [];

    try {
      const q = query(
        collection(db, 'fee_payments'),
        where('userId', '==', userId),
        where('clubId', '==', clubId),
        orderBy('paidAt', 'desc'),
        limit(50) // Last 50 payments
      );

      const snapshot = await getDocs(q);

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        history.push({
          id: doc.id,
          clubId,
          clubName,
          type: data.type,
          amount: data.amount,
          currency: data.currency,
          paidDate: data.paidAt?.toDate() || new Date(),
          method: data.method || 'unknown',
          status: data.status || 'completed',
        });
      });
    } catch (error) {
      console.error('Error getting payment history for club:', clubId, error);
    }

    return history;
  }

  /**
   * Check if a payment record exists for a user
   */
  private async getPaymentRecord(userId: string, clubId: string, type: string, period?: string) {
    try {
      let q = query(
        collection(db, 'fee_payments'),
        where('userId', '==', userId),
        where('clubId', '==', clubId),
        where('type', '==', type),
        where('status', '==', 'completed')
      );

      if (period) {
        q = query(q, where('period', '==', period));
      }

      const snapshot = await getDocs(q);
      return snapshot.empty ? null : snapshot.docs[0].data();
    } catch (error) {
      console.error('Error checking payment record:', error);
      return null;
    }
  }

  /**
   * Get membership record for a user in a club
   */
  private async getMembershipRecord(userId: string, clubId: string) {
    try {
      // 🎯 [UNIFICATION] Use clubMembers instead of club_memberships
      const q = query(
        collection(db, 'clubMembers'),
        where('userId', '==', userId),
        where('clubId', '==', clubId)
      );

      const snapshot = await getDocs(q);
      return snapshot.empty ? null : snapshot.docs[0].data();
    } catch (error) {
      console.error('Error getting membership record:', error);
      return null;
    }
  }

  /**
   * Get current month period string (YYYY-MM format)
   */
  private getCurrentMonthPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Mark a payment as pending confirmation (member submitted payment)
   * @param clubId - Club ID
   * @param userId - User ID
   * @param paymentType - Type of payment (join, monthly, yearly)
   * @param amount - Payment amount
   * @param currency - Currency
   * @param method - Payment method used
   * @returns Promise<string> - Payment record ID
   */
  async markAsPendingConfirmation(
    clubId: string,
    userId: string,
    paymentType: 'join' | 'monthly' | 'yearly',
    amount: number,
    currency: 'USD' | 'KRW',
    method: string
  ): Promise<string> {
    try {
      console.log('⏳ Marking payment as pending confirmation:', {
        clubId,
        userId,
        paymentType,
        method,
      });

      const now = new Date();
      const period =
        paymentType === 'monthly'
          ? this.getCurrentMonthPeriod()
          : paymentType === 'yearly'
            ? now.getFullYear().toString()
            : 'one-time';

      // Create payment record
      const paymentId = `${clubId}_${userId}_${paymentType}_${Date.now()}`;
      const paymentRef = doc(db, 'fee_payments', paymentId);

      const paymentDoc = {
        id: paymentId,
        clubId,
        userId,
        type: paymentType,
        period,
        amount,
        currency,
        method,
        status: 'pending_confirmation',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      };

      await setDoc(paymentRef, paymentDoc);

      console.log('✅ Payment marked as pending confirmation:', paymentId);
      return paymentId;
    } catch (error) {
      console.error('❌ Error marking payment as pending confirmation:', error);
      throw error;
    }
  }

  /**
   * Get active payment methods for a club
   * @param clubId - Club ID
   * @returns Promise<Object> - Active payment methods
   */
  async getClubPaymentMethods(clubId: string) {
    try {
      console.log('💳 Getting payment methods for club:', clubId);

      const clubRef = doc(db, 'pickleball_clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (!clubSnap.exists()) {
        throw new Error('Club not found');
      }

      const clubData = clubSnap.data();
      const paymentMethods = clubData.paymentMethods || {};

      // Filter only active methods
      const activeMethods: Record<string, unknown> = {};
      Object.keys(paymentMethods).forEach(key => {
        if (paymentMethods[key]?.isActive) {
          activeMethods[key] = paymentMethods[key];
        }
      });

      console.log('💳 Found active payment methods:', Object.keys(activeMethods));
      return activeMethods;
    } catch (error) {
      console.error('❌ Error getting club payment methods:', error);
      throw error;
    }
  }
}

// Create singleton instance
const feeService = new FeeService();

export default feeService;
