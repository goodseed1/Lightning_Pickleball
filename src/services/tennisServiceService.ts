/**
 * Pickleball Service Service
 * 피클볼 서비스 게시판 CRUD 서비스
 * 줄 교체, 패들 수리, 중고 거래 등
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
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/config';
import { COLLECTIONS } from '../constants/collections';
import {
  PickleballService,
  CreateServiceRequest,
  UpdateServiceRequest,
  ServiceLocation,
} from '../types/pickleballService';

// 🛡️ 도용 방지: 게시 제한 상수
const DAILY_POST_LIMIT = 3; // 하루 최대 3개
const MAX_TOTAL_POSTS = 5; // 총 최대 5개

class PickleballServiceService {
  private collectionRef = collection(db, COLLECTIONS.TENNIS_SERVICES);

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
   * 이미지 업로드 (Firebase Storage)
   */
  async uploadImage(uri: string, userId: string): Promise<string> {
    try {
      // URI에서 blob 생성
      const response = await fetch(uri);
      const blob = await response.blob();

      // 파일명 생성
      const timestamp = Date.now();
      const filename = `pickleball_services/${userId}/${timestamp}.jpg`;
      const storageRef = ref(storage, filename);

      // 업로드
      await uploadBytes(storageRef, blob);

      // 다운로드 URL 반환
      const downloadURL = await getDownloadURL(storageRef);
      console.log('📸 [PickleballServiceService] Image uploaded:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ [PickleballServiceService] Error uploading image:', error);
      throw error;
    }
  }

  /**
   * 이미지 삭제 (Firebase Storage)
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
      console.log('🗑️ [PickleballServiceService] Image deleted:', imageUrl);
    } catch (error) {
      // 이미지가 없어도 에러 무시
      console.warn('⚠️ [PickleballServiceService] Error deleting image:', error);
    }
  }

  /**
   * 서비스 게시글 생성
   */
  async createService(
    request: CreateServiceRequest,
    authorId: string,
    authorName: string,
    authorPhotoURL?: string,
    authorCoordinates?: ServiceLocation
  ): Promise<string> {
    try {
      // 🛡️ 게시 제한 확인
      await this.checkPostingLimits(authorId);

      const serviceData = {
        authorId,
        authorName,
        ...(authorPhotoURL && { authorPhotoURL }),
        title: request.title,
        ...(request.description && { description: request.description }),
        ...(request.category && { category: request.category }),
        ...(request.images && request.images.length > 0 && { images: request.images }),
        ...(request.price !== undefined && { price: request.price }),
        ...(request.contactInfo && { contactInfo: request.contactInfo }),
        ...(request.coordinates && { coordinates: request.coordinates }),
        ...(authorCoordinates && !request.coordinates && { coordinates: authorCoordinates }),
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(this.collectionRef, serviceData);
      console.log('🛠️ [PickleballServiceService] Service created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ [PickleballServiceService] Error creating service:', error);
      throw error;
    }
  }

  /**
   * 서비스 게시글 조회 (단일)
   */
  async getService(serviceId: string): Promise<PickleballService | null> {
    try {
      const docRef = doc(this.collectionRef, serviceId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as PickleballService;
    } catch (error) {
      console.error('❌ [PickleballServiceService] Error getting service:', error);
      throw error;
    }
  }

  /**
   * 서비스 목록 조회 (활성 상태만)
   */
  async getServices(limitCount: number = 50): Promise<PickleballService[]> {
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
          }) as PickleballService
      );
    } catch (error) {
      console.error('❌ [PickleballServiceService] Error getting services:', error);
      throw error;
    }
  }

  /**
   * 서비스 목록 실시간 구독
   */
  listenToServices(
    callback: (services: PickleballService[]) => void,
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
        const services = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as PickleballService
        );
        callback(services);
      },
      error => {
        console.error('❌ [PickleballServiceService] Listener error:', error);
      }
    );
  }

  /**
   * 서비스 게시글 수정
   */
  async updateService(serviceId: string, request: UpdateServiceRequest): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, serviceId);

      const updateData: Record<string, unknown> = {
        updatedAt: serverTimestamp(),
      };

      if (request.title !== undefined) updateData.title = request.title;
      if (request.description !== undefined) updateData.description = request.description;
      if (request.category !== undefined) updateData.category = request.category;
      if (request.images !== undefined) updateData.images = request.images;
      if (request.price !== undefined) updateData.price = request.price;
      if (request.contactInfo !== undefined) updateData.contactInfo = request.contactInfo;
      if (request.status !== undefined) updateData.status = request.status;

      await updateDoc(docRef, updateData);
      console.log('🛠️ [PickleballServiceService] Service updated:', serviceId);
    } catch (error) {
      console.error('❌ [PickleballServiceService] Error updating service:', error);
      throw error;
    }
  }

  /**
   * 서비스 게시글 삭제 (소프트 삭제)
   */
  async deleteService(serviceId: string): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, serviceId);
      await updateDoc(docRef, {
        status: 'deleted',
        updatedAt: serverTimestamp(),
      });
      console.log('🛠️ [PickleballServiceService] Service deleted:', serviceId);
    } catch (error) {
      console.error('❌ [PickleballServiceService] Error deleting service:', error);
      throw error;
    }
  }

  /**
   * 서비스 게시글 영구 삭제 (하드 삭제)
   */
  async permanentlyDeleteService(serviceId: string): Promise<void> {
    try {
      const docRef = doc(this.collectionRef, serviceId);
      await deleteDoc(docRef);
      console.log('🛠️ [PickleballServiceService] Service permanently deleted:', serviceId);
    } catch (error) {
      console.error('❌ [PickleballServiceService] Error permanently deleting service:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 export
const pickleballServiceService = new PickleballServiceService();
export default pickleballServiceService;
