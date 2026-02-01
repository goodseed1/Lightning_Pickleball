/**
 * 🗑️ Cleanup Expired Event Images Cloud Function
 *
 * 완료된 이벤트의 채팅 이미지를 7일 후 자동 삭제합니다.
 * 매일 자정(UTC)에 스케줄 실행됩니다.
 *
 * 🛡️ 저장 공간 보호:
 * - 악의적인 사용자가 무한히 이벤트를 생성해도
 * - 완료된 이벤트의 이미지는 7일 후 자동 삭제됨
 *
 * @author Claude
 * @date 2026-01-31
 */

import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions/v2';

const db = admin.firestore();
const storage = admin.storage().bucket();

// 이벤트 종료 후 이미지 보관 기간 (일)
const IMAGE_RETENTION_DAYS = 7;

/**
 * 매일 자정(UTC)에 실행되는 스케줄 함수
 * 완료된 이벤트 중 7일 이상 지난 이벤트의 채팅 이미지를 삭제
 */
export const cleanupExpiredEventImages = onSchedule(
  {
    schedule: '0 0 * * *', // 매일 자정 (UTC)
    timeZone: 'UTC',
    retryCount: 3,
  },
  async () => {
    logger.info('🗑️ [CLEANUP] Starting expired event images cleanup...');

    try {
      // 7일 전 날짜 계산
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - IMAGE_RETENTION_DAYS);
      const cutoffTimestamp = admin.firestore.Timestamp.fromDate(cutoffDate);

      logger.info(`📅 [CLEANUP] Cutoff date: ${cutoffDate.toISOString()}`);

      // 완료된 이벤트 중 cutoffDate 이전에 종료된 이벤트 조회
      const expiredEventsQuery = await db
        .collection('events')
        .where('status', '==', 'completed')
        .where('endTime', '<=', cutoffTimestamp)
        .get();

      logger.info(`📊 [CLEANUP] Found ${expiredEventsQuery.size} expired events`);

      if (expiredEventsQuery.empty) {
        logger.info('✅ [CLEANUP] No expired events to clean up');
        return;
      }

      let totalDeletedImages = 0;
      let totalDeletedEvents = 0;

      // 각 만료된 이벤트의 이미지 삭제
      for (const eventDoc of expiredEventsQuery.docs) {
        const eventId = eventDoc.id;
        const eventData = eventDoc.data();

        logger.info(`🔄 [CLEANUP] Processing event: ${eventId} (${eventData.title || 'Untitled'})`);

        try {
          // Storage에서 해당 이벤트의 이미지 폴더 삭제
          const folderPath = `chat_images/event/${eventId}/`;
          const [files] = await storage.getFiles({ prefix: folderPath });

          if (files.length > 0) {
            logger.info(`  📸 Found ${files.length} images to delete`);

            // 이미지 삭제 및 사용자 추적 해제
            for (const file of files) {
              try {
                // 메타데이터에서 업로더 정보 가져오기
                const [metadata] = await file.getMetadata();
                const uploadedBy = metadata.metadata?.uploadedBy;
                const storagePath = file.name; // Storage 경로

                // 이미지 삭제
                await file.delete();

                // 사용자 이미지 추적 해제 (카운트 + 추적 문서)
                if (uploadedBy && typeof uploadedBy === 'string') {
                  await untrackUserImage(uploadedBy, storagePath);
                }

                totalDeletedImages++;
              } catch (fileError) {
                logger.warn(`  ⚠️ Failed to delete file ${file.name}:`, fileError);
              }
            }

            logger.info(`  ✅ Deleted ${files.length} images from event ${eventId}`);
          } else {
            logger.info(`  ℹ️ No images found for event ${eventId}`);
          }

          // 이벤트에 이미지 정리 완료 표시 (선택적)
          await eventDoc.ref.update({
            chatImagesCleanedAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          totalDeletedEvents++;
        } catch (eventError) {
          logger.error(`❌ [CLEANUP] Error processing event ${eventId}:`, eventError);
        }
      }

      logger.info(
        `🎉 [CLEANUP] Completed! Deleted ${totalDeletedImages} images from ${totalDeletedEvents} events`
      );
    } catch (error) {
      logger.error('❌ [CLEANUP] Fatal error during cleanup:', error);
      throw error;
    }
  }
);

/**
 * 사용자 이미지 추적 해제 (카운트 감소 + 추적 문서 삭제)
 */
async function untrackUserImage(userId: string, storagePath: string): Promise<void> {
  try {
    const statsRef = db.collection('chat_image_stats').doc(userId);
    const statsSnap = await statsRef.get();

    // 1. 카운트 감소
    if (statsSnap.exists) {
      const currentCount = statsSnap.data()?.totalCount || 0;
      await statsRef.set(
        {
          totalCount: Math.max(0, currentCount - 1),
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    // 2. 추적 문서 삭제 (subcollection에서 storagePath로 검색)
    const imagesRef = statsRef.collection('images');
    const trackQuery = await imagesRef.where('storagePath', '==', storagePath).get();

    for (const trackDoc of trackQuery.docs) {
      await trackDoc.ref.delete();
      logger.info(`  🗑️ Deleted tracking doc: ${trackDoc.id}`);
    }
  } catch (error) {
    logger.warn(`[CLEANUP] Error untracking user image for ${userId}:`, error);
  }
}
