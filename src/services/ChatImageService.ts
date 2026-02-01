/**
 * ChatImageService
 *
 * 채팅방 이미지 업로드, 삭제 및 한도 관리를 담당합니다.
 *
 * 📸 이미지 한도:
 * - 개인 채팅: 30장 (채팅방당)
 * - 클럽 채팅: 50장 (채팅방당)
 * - 이벤트 채팅: 30장 (채팅방당)
 * - 🛡️ 사용자별 총 한도: 100장 (모든 채팅방 합산)
 *
 * 채팅방 한도 초과 시 가장 오래된 이미지부터 자동 삭제됩니다.
 * 🆕 사용자 총 한도 초과 시에도 가장 오래된 이미지를 자동 삭제 후 업로드합니다.
 */

import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
  getMetadata,
} from 'firebase/storage';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  limit as firestoreLimit,
  Timestamp,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  increment,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { storage, db } from '../firebase/config';
import { ImageResult } from './CameraService';

// 채팅 타입별 이미지 한도
export const CHAT_IMAGE_LIMITS = {
  direct: 30, // 개인 채팅
  club: 50, // 클럽 채팅
  event: 30, // 이벤트 채팅
} as const;

// 🛡️ 사용자별 총 이미지 한도 (모든 채팅방 합산)
export const USER_TOTAL_IMAGE_LIMIT = 100;

export type ChatType = keyof typeof CHAT_IMAGE_LIMITS;

export interface ChatImage {
  id: string;
  url: string;
  fileName: string;
  uploadedAt: Date;
  uploadedBy: string;
  storagePath: string;
}

export interface UploadResult {
  success: boolean;
  imageUrl?: string;
  storagePath?: string;
  error?: string;
}

/**
 * 🛡️ 사용자 이미지 추적을 위한 인터페이스
 * Firestore: chat_image_stats/{userId}/images/{imageId}
 */
export interface UserImageTrack {
  storagePath: string;
  chatType: ChatType;
  chatId: string;
  uploadedAt: Date;
}

class ChatImageService {
  private static instance: ChatImageService;

  public static getInstance(): ChatImageService {
    if (!ChatImageService.instance) {
      ChatImageService.instance = new ChatImageService();
    }
    return ChatImageService.instance;
  }

  /**
   * 채팅방 이미지 저장 경로 생성
   */
  private getStoragePath(chatType: ChatType, chatId: string, fileName: string): string {
    return `chat_images/${chatType}/${chatId}/${fileName}`;
  }

  /**
   * 🛡️ 사용자별 총 이미지 수 조회
   */
  async getUserImageCount(userId: string): Promise<number> {
    try {
      const statsRef = doc(db, 'chat_image_stats', userId);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        return statsSnap.data().totalCount || 0;
      }
      return 0;
    } catch (error) {
      console.warn('[ChatImageService] Error getting user image count:', error);
      return 0;
    }
  }

  /**
   * 🛡️ 사용자별 이미지 카운트 증가 및 추적 문서 생성
   */
  private async trackUserImage(
    userId: string,
    storagePath: string,
    chatType: ChatType,
    chatId: string
  ): Promise<string | null> {
    try {
      const statsRef = doc(db, 'chat_image_stats', userId);

      // 1. 카운트 증가
      await setDoc(statsRef, {
        totalCount: increment(1),
        lastUpdated: serverTimestamp(),
      }, { merge: true });

      // 2. 이미지 추적 문서 추가 (subcollection)
      const imagesRef = collection(db, 'chat_image_stats', userId, 'images');
      const trackDoc = await addDoc(imagesRef, {
        storagePath,
        chatType,
        chatId,
        uploadedAt: serverTimestamp(),
      });

      console.log(`📝 [ChatImageService] Tracked image for user ${userId}: ${trackDoc.id}`);
      return trackDoc.id;
    } catch (error) {
      console.warn('[ChatImageService] Error tracking user image:', error);
      return null;
    }
  }

  /**
   * 🛡️ 사용자별 이미지 카운트 감소 및 추적 문서 삭제
   */
  private async untrackUserImage(userId: string, storagePath: string): Promise<void> {
    try {
      const statsRef = doc(db, 'chat_image_stats', userId);
      const statsSnap = await getDoc(statsRef);

      if (statsSnap.exists()) {
        const currentCount = statsSnap.data().totalCount || 0;
        await setDoc(statsRef, {
          totalCount: Math.max(0, currentCount - 1),
          lastUpdated: serverTimestamp(),
        }, { merge: true });
      }

      // 추적 문서 삭제 (storagePath로 검색)
      const imagesRef = collection(db, 'chat_image_stats', userId, 'images');
      const q = query(imagesRef, where('storagePath', '==', storagePath));
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
        console.log(`🗑️ [ChatImageService] Untracked image: ${docSnap.id}`);
      }
    } catch (error) {
      console.warn('[ChatImageService] Error untracking user image:', error);
    }
  }

  /**
   * 🛡️ 사용자 한도 초과 시 가장 오래된 이미지 삭제
   * @returns 삭제된 이미지 수
   */
  private async deleteOldestUserImages(userId: string, deleteCount: number): Promise<number> {
    try {
      console.log(`🔄 [ChatImageService] Deleting ${deleteCount} oldest images for user ${userId}`);

      // 가장 오래된 이미지 추적 문서 조회
      const imagesRef = collection(db, 'chat_image_stats', userId, 'images');
      const q = query(imagesRef, orderBy('uploadedAt', 'asc'), firestoreLimit(deleteCount));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        console.warn('[ChatImageService] No tracked images found to delete');
        return 0;
      }

      let deletedCount = 0;

      for (const docSnap of snapshot.docs) {
        const trackData = docSnap.data();
        const storagePath = trackData.storagePath;

        try {
          // 1. Storage에서 이미지 삭제
          const imageRef = ref(storage, storagePath);
          await deleteObject(imageRef);
          console.log(`  ✅ Deleted from storage: ${storagePath}`);

          // 2. 추적 문서 삭제
          await deleteDoc(docSnap.ref);

          // 3. 카운트 감소
          const statsRef = doc(db, 'chat_image_stats', userId);
          const statsSnap = await getDoc(statsRef);
          if (statsSnap.exists()) {
            const currentCount = statsSnap.data().totalCount || 0;
            await setDoc(statsRef, {
              totalCount: Math.max(0, currentCount - 1),
              lastUpdated: serverTimestamp(),
            }, { merge: true });
          }

          deletedCount++;
        } catch (deleteError) {
          console.warn(`  ⚠️ Failed to delete ${storagePath}:`, deleteError);
          // Storage에서 실패해도 추적 문서는 삭제 (orphaned track)
          await deleteDoc(docSnap.ref);
        }
      }

      console.log(`🎉 [ChatImageService] Deleted ${deletedCount} oldest images`);
      return deletedCount;
    } catch (error) {
      console.error('[ChatImageService] Error deleting oldest user images:', error);
      return 0;
    }
  }

  /**
   * 이미지 업로드
   */
  async uploadChatImage(
    chatType: ChatType,
    chatId: string,
    image: ImageResult,
    userId: string
  ): Promise<UploadResult> {
    try {
      console.log(`📸 [ChatImageService] Uploading image to ${chatType}/${chatId}`);

      // 🛡️ 0. 사용자별 총 이미지 한도 체크 및 자동 삭제
      const userImageCount = await this.getUserImageCount(userId);
      if (userImageCount >= USER_TOTAL_IMAGE_LIMIT) {
        console.log(`⚠️ [ChatImageService] User ${userId} at limit (${userImageCount}/${USER_TOTAL_IMAGE_LIMIT}), auto-deleting oldest...`);

        // 🆕 한도 도달 시 가장 오래된 이미지 1장 삭제
        const deletedCount = await this.deleteOldestUserImages(userId, 1);

        if (deletedCount === 0) {
          // 삭제할 이미지를 찾지 못한 경우 (추적 데이터 없음)
          console.error('[ChatImageService] Failed to auto-delete oldest image');
          return {
            success: false,
            error: `이미지 업로드 한도(${USER_TOTAL_IMAGE_LIMIT}장)에 도달했습니다. 기존 이미지를 수동으로 삭제해주세요.`,
          };
        }

        console.log(`✅ [ChatImageService] Auto-deleted ${deletedCount} oldest image(s)`);
      }

      // 1. 현재 이미지 개수 확인 및 한도 초과 시 정리
      await this.enforceImageLimit(chatType, chatId);

      // 2. 고유한 파일명 생성
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const extension = image.fileName?.split('.').pop() || 'jpg';
      const fileName = `${timestamp}_${randomSuffix}.${extension}`;

      // 3. Storage 경로 생성
      const storagePath = this.getStoragePath(chatType, chatId, fileName);
      const storageRef = ref(storage, storagePath);

      // 4. 이미지 파일 가져오기 및 업로드
      const response = await fetch(image.uri);
      const blob = await response.blob();

      // 메타데이터 추가
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          uploadedBy: userId,
          chatType,
          chatId,
          uploadedAt: new Date().toISOString(),
        },
      };

      await uploadBytes(storageRef, blob, metadata);

      // 5. 다운로드 URL 가져오기
      const imageUrl = await getDownloadURL(storageRef);

      // 🛡️ 6. 사용자별 이미지 추적 (카운트 + subcollection)
      await this.trackUserImage(userId, storagePath, chatType, chatId);

      console.log(`✅ [ChatImageService] Image uploaded successfully: ${storagePath}`);

      return {
        success: true,
        imageUrl,
        storagePath,
      };
    } catch (error) {
      console.error('❌ [ChatImageService] Error uploading image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload image',
      };
    }
  }

  /**
   * 이미지 한도 강제 적용 - 초과 시 오래된 이미지 삭제
   */
  async enforceImageLimit(chatType: ChatType, chatId: string): Promise<void> {
    try {
      const limit = CHAT_IMAGE_LIMITS[chatType];
      const folderPath = `chat_images/${chatType}/${chatId}`;
      const folderRef = ref(storage, folderPath);

      // 폴더 내 모든 파일 목록 가져오기
      const listResult = await listAll(folderRef);
      const items = listResult.items;

      console.log(
        `📊 [ChatImageService] ${chatType}/${chatId}: ${items.length}/${limit} images`
      );

      // 한도 미만이면 삭제 불필요
      if (items.length < limit) {
        return;
      }

      // 파일들의 메타데이터 가져와서 시간순 정렬
      const itemsWithMetadata = await Promise.all(
        items.map(async item => {
          try {
            const metadata = await getMetadata(item);
            return {
              ref: item,
              timeCreated: new Date(metadata.timeCreated),
              uploadedBy: metadata.customMetadata?.uploadedBy, // 🛡️ 업로더 정보 저장
            };
          } catch {
            // 메타데이터 가져오기 실패 시 현재 시간으로 대체
            return {
              ref: item,
              timeCreated: new Date(),
              uploadedBy: undefined,
            };
          }
        })
      );

      // 시간순 정렬 (오래된 것이 앞에)
      itemsWithMetadata.sort((a, b) => a.timeCreated.getTime() - b.timeCreated.getTime());

      // 한도를 초과하는 만큼 오래된 이미지 삭제
      const deleteCount = items.length - limit + 1; // +1 for the new image being uploaded
      const toDelete = itemsWithMetadata.slice(0, deleteCount);

      console.log(`🗑️ [ChatImageService] Deleting ${deleteCount} old images...`);

      await Promise.all(
        toDelete.map(async item => {
          try {
            const fullPath = item.ref.fullPath;
            await deleteObject(item.ref);
            // 🛡️ 사용자 이미지 추적 해제
            if (item.uploadedBy) {
              await this.untrackUserImage(item.uploadedBy, fullPath);
            }
            console.log(`  - Deleted: ${item.ref.name}`);
          } catch (deleteError) {
            console.warn(`  - Failed to delete ${item.ref.name}:`, deleteError);
          }
        })
      );
    } catch (error) {
      // 폴더가 없으면 무시 (첫 이미지 업로드 시)
      if ((error as { code?: string }).code === 'storage/object-not-found') {
        return;
      }
      console.warn('[ChatImageService] Error enforcing image limit:', error);
    }
  }

  /**
   * 특정 이미지 삭제
   */
  async deleteImage(storagePath: string, userId?: string): Promise<boolean> {
    try {
      const imageRef = ref(storage, storagePath);

      // 🛡️ 삭제 전 메타데이터에서 업로더 확인 (userId가 없으면)
      let uploadedBy = userId;
      if (!uploadedBy) {
        try {
          const metadata = await getMetadata(imageRef);
          uploadedBy = metadata.customMetadata?.uploadedBy;
        } catch {
          // 메타데이터 가져오기 실패 시 무시
        }
      }

      await deleteObject(imageRef);

      // 🛡️ 사용자 이미지 추적 해제
      if (uploadedBy) {
        await this.untrackUserImage(uploadedBy, storagePath);
      }

      console.log(`🗑️ [ChatImageService] Deleted image: ${storagePath}`);
      return true;
    } catch (error) {
      console.error('[ChatImageService] Error deleting image:', error);
      return false;
    }
  }

  /**
   * 채팅방의 모든 이미지 삭제 (채팅방 삭제 시 사용)
   */
  async deleteAllImagesInChat(chatType: ChatType, chatId: string): Promise<void> {
    try {
      const folderPath = `chat_images/${chatType}/${chatId}`;
      const folderRef = ref(storage, folderPath);

      const listResult = await listAll(folderRef);

      await Promise.all(
        listResult.items.map(async item => {
          try {
            await deleteObject(item);
          } catch (deleteError) {
            console.warn(`Failed to delete ${item.name}:`, deleteError);
          }
        })
      );

      console.log(`🗑️ [ChatImageService] Deleted all images in ${chatType}/${chatId}`);
    } catch (error) {
      console.warn('[ChatImageService] Error deleting all images:', error);
    }
  }

  /**
   * 채팅방의 이미지 개수 가져오기
   */
  async getImageCount(chatType: ChatType, chatId: string): Promise<number> {
    try {
      const folderPath = `chat_images/${chatType}/${chatId}`;
      const folderRef = ref(storage, folderPath);

      const listResult = await listAll(folderRef);
      return listResult.items.length;
    } catch {
      return 0;
    }
  }

  /**
   * 채팅방의 이미지 목록 가져오기
   */
  async getImagesInChat(chatType: ChatType, chatId: string): Promise<ChatImage[]> {
    try {
      const folderPath = `chat_images/${chatType}/${chatId}`;
      const folderRef = ref(storage, folderPath);

      const listResult = await listAll(folderRef);

      const images = await Promise.all(
        listResult.items.map(async item => {
          try {
            const url = await getDownloadURL(item);
            const metadata = await getMetadata(item);

            return {
              id: item.name,
              url,
              fileName: item.name,
              uploadedAt: new Date(metadata.timeCreated),
              uploadedBy: metadata.customMetadata?.uploadedBy || 'unknown',
              storagePath: item.fullPath,
            };
          } catch {
            return null;
          }
        })
      );

      return images.filter((img): img is ChatImage => img !== null);
    } catch {
      return [];
    }
  }

  /**
   * 이미지 메시지 데이터 생성
   */
  createImageMessageData(
    imageUrl: string,
    storagePath: string,
    senderId: string,
    senderName: string,
    senderPhotoURL?: string
  ): {
    type: 'image';
    message: string;
    imageUrl: string;
    storagePath: string;
    senderId: string;
    senderName: string;
    senderPhotoURL?: string;
  } {
    return {
      type: 'image',
      message: '📷 Photo', // 미리보기용 텍스트
      imageUrl,
      storagePath,
      senderId,
      senderName,
      senderPhotoURL,
    };
  }
}

export default ChatImageService.getInstance();
