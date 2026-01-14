/**
 * Coach Lesson Service
 * 코치 레슨 게시판 CRUD 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '../firebase/config';

import { COLLECTIONS } from '../constants/collections';
import {
  CoachLesson,
  CreateLessonRequest,
  UpdateLessonRequest,
  LessonLocation,
} from '../types/coachLesson';

// 🛡️ 도용 방지: 게시 제한 상수
const DAILY_POST_LIMIT = 3; // 하루 최대 3개
const MAX_TOTAL_POSTS = 5; // 총 최대 5개

class CoachLessonService {
  private collectionRef = collection(db, COLLECTIONS.COACH_LESSONS);

  /**
   * 🛡️ 게시 제한 확인
   * - 하루 최대 3개
   * - 총 최대 5개 (활성 상태)
   */
  async checkPostingLimits(authorId: string): Promise<void> {
    // 1. 총 활성 게시글 수 확인
    const totalQuery = query(
      this.collectionRef,
      where('authorId', '==', authorId),
      where('status', '==', 'active')
    );
    const totalSnapshot = await getCountFromServer(totalQuery);
    const totalCount = totalSnapshot.data().count;

    if (totalCount >= MAX_TOTAL_POSTS) {
      throw new Error(`MAX_POSTS_EXCEEDED:${MAX_TOTAL_POSTS}`);
    }

    // 2. 오늘 게시한 글 수 확인
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const dailyQuery = query(
      this.collectionRef,
      where('authorId', '==', authorId),
      where('createdAt', '>=', Timestamp.fromDate(todayStart))
    );
    const dailySnapshot = await getCountFromServer(dailyQuery);
    const dailyCount = dailySnapshot.data().count;

    if (dailyCount >= DAILY_POST_LIMIT) {
      throw new Error(`DAILY_LIMIT_EXCEEDED:${DAILY_POST_LIMIT}`);
    }
  }

  /**
   * 레슨 생성
   */
  async createLesson(
    request: CreateLessonRequest,
    authorId: string,
    authorName: string,
    authorPhotoURL?: string,
    authorCoordinates?: LessonLocation
  ): Promise<string> {
    try {
      // 🛡️ 게시 제한 확인
      await this.checkPostingLimits(authorId);

      const lessonData = {
        authorId,
        authorName,
        ...(authorPhotoURL && { authorPhotoURL }),
        title: request.title,
        description: request.description,
        ...(request.dateTime && { dateTime: Timestamp.fromDate(request.dateTime) }),
        ...(request.location && { location: request.location }),
        ...(request.fee !== undefined && { fee: request.fee }),
        ...(request.maxParticipants !== undefined && { maxParticipants: request.maxParticipants }),
        ...(request.coordinates && { coordinates: request.coordinates }),
        ...(authorCoordinates && !request.coordinates && { coordinates: authorCoordinates }),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(this.collectionRef, lessonData);
      console.log('📚 [CoachLessonService] Lesson created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [CoachLessonService] Error creating lesson:', error);
      throw error;
    }
  }

  /**
   * 레슨 조회 (단일)
   */
  async getLesson(lessonId: string): Promise<CoachLesson | null> {
    try {
      const docRef = doc(this.collectionRef, lessonId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as CoachLesson;
    } catch (error) {
      console.error('❌ [CoachLessonService] Error getting lesson:', error);
      throw error;
    }
  }

  /**
   * 레슨 목록 조회 (활성 상태만)
   */
  async getLessons(limitCount: number = 50): Promise<CoachLesson[]> {
    try {
      const q = query(
        this.collectionRef,
        where('status', '==', 'active'),
        orderBy('createdAt', 'desc'),
        firestoreLimit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as CoachLesson
      );
    } catch (error) {
      console.error('❌ [CoachLessonService] Error getting lessons:', error);
      throw error;
    }
  }

  /**
   * 레슨 목록 실시간 구독
   */
  listenToLessons(
    callback: (lessons: CoachLesson[]) => void,
    limitCount: number = 50
  ): Unsubscribe {
    const q = query(
      this.collectionRef,
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );

    return onSnapshot(
      q,
      snapshot => {
        const lessons = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as CoachLesson
        );
        callback(lessons);
      },
      error => {
        console.error('❌ [CoachLessonService] Listener error:', error);
      }
    );
  }

  /**
   * 레슨 수정
   */
  async updateLesson(lessonId: string, request: UpdateLessonRequest): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, lessonId);

      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (request.title !== undefined) updateData.title = request.title;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.dateTime !== undefined)
        updateData.dateTime = Timestamp.fromDate(request.dateTime);
      if (request.location !== undefined) updateData.location = request.location;
      if (request.fee !== undefined) updateData.fee = request.fee;
      if (request.maxParticipants !== undefined)
        updateData.maxParticipants = request.maxParticipants;
      if (request.status !== undefined) updateData.status = request.status;

      await updateDoc(docRef, updateData);
      console.log('📚 [CoachLessonService] Lesson updated:', lessonId);
    } catch (error) {
      console.error('❌ [CoachLessonService] Error updating lesson:', error);
      throw error;
    }
  }

  /**
   * 레슨 삭제 (소프트 삭제)
   */
  async deleteLesson(lessonId: string): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, lessonId);
      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
      console.log('📚 [CoachLessonService] Lesson deleted:', lessonId);
    } catch (error) {
      console.error('❌ [CoachLessonService] Error deleting lesson:', error);
      throw error;
    }
  }

  /**
   * 레슨 영구 삭제 (하드 삭제)
   */
  async permanentlyDeleteLesson(lessonId: string): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, lessonId);
      await deleteDoc(docRef);
      console.log('📚 [CoachLessonService] Lesson permanently deleted:', lessonId);
    } catch (error) {
      console.error('❌ [CoachLessonService] Error permanently deleting lesson:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 export
const coachLessonService = new CoachLessonService();
export default coachLessonService;
