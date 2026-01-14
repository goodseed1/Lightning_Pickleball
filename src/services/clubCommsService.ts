/**
 * Club Communications Service
 * Lightning Tennis 클럽 커뮤니케이션 서비스
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
  onSnapshot,
  Unsubscribe,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  ClubPolicy,
  ClubPost,
  PostComment,
  ChatMessage,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  SendMessageRequest,
  PostSummary,
  ChatRoomInfo,
  CommunicationStats,
  getPostExcerpt,
} from '../types/clubCommunication';
import i18n from '../i18n';

class ClubCommunicationsService {
  // ========================
  // 클럽 정책 관련
  // ========================

  /**
   * 클럽 정책 조회
   */
  async getClubPolicy(clubId: string): Promise<ClubPolicy | null> {
    try {
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));

      if (!clubDoc.exists()) {
        return null;
      }

      const clubData = clubDoc.data();

      if (!clubData.policy) {
        return null;
      }

      return {
        clubId,
        content: clubData.policy.content || '',
        lastUpdatedBy: clubData.policy.lastUpdatedBy || '',
        lastUpdatedAt: clubData.policy.lastUpdatedAt || (serverTimestamp() as Timestamp),
        version: clubData.policy.version || 1,
      };
    } catch (error) {
      console.error('Error getting club policy:', error);
      throw error;
    }
  }

  /**
   * 클럽 정책 업데이트
   */
  async updateClubPolicy(clubId: string, content: string, updatedBy: string): Promise<void> {
    try {
      const clubRef = doc(db, 'clubs', clubId);
      const clubDoc = await getDoc(clubRef);

      if (!clubDoc.exists()) {
        throw new Error('Club not found');
      }

      const currentPolicy = clubDoc.data().policy;
      const newVersion = (currentPolicy?.version || 0) + 1;

      await updateDoc(clubRef, {
        policy: {
          content,
          lastUpdatedBy: updatedBy,
          lastUpdatedAt: serverTimestamp(),
          version: newVersion,
        },
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Club policy updated:', clubId);
    } catch (error) {
      console.error('Error updating club policy:', error);
      throw error;
    }
  }

  // ========================
  // 게시판 관련
  // ========================

  /**
   * 게시글 생성
   */
  async createPost(
    request: CreatePostRequest,
    authorId: string,
    authorName: string,
    authorAvatar?: string
  ): Promise<string> {
    try {
      const postData: Omit<ClubPost, 'id'> = {
        clubId: request.clubId,
        title: request.title,
        content: request.content,
        authorId,
        authorName,
        authorAvatar,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        commentCount: 0,
        isAnnouncement: request.isAnnouncement || false,
        isPinned: request.isPinned || false,
      };

      const docRef = await addDoc(collection(db, 'club_posts'), postData);

      console.log('✅ Post created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * 클럽 게시글 목록 조회
   */
  async getClubPosts(
    clubId: string,
    limitCount: number = 20,
    onlyAnnouncements: boolean = false
  ): Promise<ClubPost[]> {
    try {
      const postsRef = collection(db, 'club_posts');
      let q = query(
        postsRef,
        where('clubId', '==', clubId),
        orderBy('isPinned', 'desc'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (onlyAnnouncements) {
        q = query(
          postsRef,
          where('clubId', '==', clubId),
          where('isAnnouncement', '==', true),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ClubPost[];
    } catch (error) {
      console.error('Error getting club posts:', error);
      throw error;
    }
  }

  /**
   * 게시글 요약 목록 조회 (성능 최적화)
   */
  async getPostSummaries(clubId: string, limitCount: number = 20): Promise<PostSummary[]> {
    try {
      const posts = await this.getClubPosts(clubId, limitCount);

      return posts.map(post => ({
        id: post.id,
        title: post.title,
        authorName: post.authorName,
        createdAt: post.createdAt,
        commentCount: post.commentCount,
        isAnnouncement: post.isAnnouncement,
        isPinned: post.isPinned,
        excerpt: getPostExcerpt(post.content),
      }));
    } catch (error) {
      console.error('Error getting post summaries:', error);
      throw error;
    }
  }

  /**
   * 게시글 상세 조회
   */
  async getPost(postId: string): Promise<ClubPost | null> {
    try {
      const postDoc = await getDoc(doc(db, 'club_posts', postId));

      if (!postDoc.exists()) {
        return null;
      }

      return {
        id: postDoc.id,
        ...postDoc.data(),
      } as ClubPost;
    } catch (error) {
      console.error('Error getting post:', error);
      throw error;
    }
  }

  /**
   * 게시글 업데이트
   */
  async updatePost(postId: string, updates: UpdatePostRequest, authorId: string): Promise<void> {
    try {
      // 작성자 권한 확인
      const post = await this.getPost(postId);
      if (!post || post.authorId !== authorId) {
        throw new Error(i18n.t('services.clubComms.permissionDenied'));
      }

      await updateDoc(doc(db, 'club_posts', postId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });

      console.log('✅ Post updated:', postId);
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  /**
   * 게시글 삭제
   */
  async deletePost(postId: string, authorId: string): Promise<void> {
    try {
      // 작성자 권한 확인
      const post = await this.getPost(postId);
      if (!post || post.authorId !== authorId) {
        throw new Error(i18n.t('services.clubComms.permissionDenied'));
      }

      const batch = writeBatch(db);

      // 게시글 삭제
      batch.delete(doc(db, 'club_posts', postId));

      // 관련 댓글 삭제
      const commentsRef = collection(db, 'club_post_comments');
      const commentsQuery = query(commentsRef, where('postId', '==', postId));
      const commentsSnapshot = await getDocs(commentsQuery);

      commentsSnapshot.docs.forEach(commentDoc => {
        batch.delete(commentDoc.ref);
      });

      await batch.commit();

      console.log('✅ Post and comments deleted:', postId);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // ========================
  // 댓글 관련
  // ========================

  /**
   * 댓글 추가
   */
  async addComment(
    request: CreateCommentRequest,
    authorId: string,
    authorName: string,
    authorAvatar?: string
  ): Promise<string> {
    try {
      const commentData: Omit<PostComment, 'id'> = {
        postId: request.postId,
        clubId: request.clubId,
        content: request.content,
        authorId,
        authorName,
        authorAvatar,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        parentCommentId: request.parentCommentId,
      };

      const batch = writeBatch(db);

      // 댓글 추가
      const commentRef = doc(collection(db, 'club_post_comments'));
      batch.set(commentRef, commentData);

      // 게시글 댓글 수 증가
      const postRef = doc(db, 'club_posts', request.postId);
      batch.update(postRef, {
        commentCount: increment(1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      console.log('✅ Comment added:', commentRef.id);
      return commentRef.id;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * 게시글 댓글 목록 조회
   */
  async getPostComments(postId: string): Promise<PostComment[]> {
    try {
      const commentsRef = collection(db, 'club_post_comments');
      const q = query(
        commentsRef,
        where('postId', '==', postId),
        where('isDeleted', '!=', true),
        orderBy('createdAt', 'asc')
      );

      const snapshot = await getDocs(q);

      const comments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PostComment[];

      // 댓글과 대댓글 구조화
      const commentMap = new Map<string, PostComment>();
      const rootComments: PostComment[] = [];

      comments.forEach(comment => {
        comment.replies = [];
        commentMap.set(comment.id, comment);

        if (!comment.parentCommentId) {
          rootComments.push(comment);
        }
      });

      // 대댓글 연결
      comments.forEach(comment => {
        if (comment.parentCommentId) {
          const parentComment = commentMap.get(comment.parentCommentId);
          if (parentComment) {
            parentComment.replies!.push(comment);
          }
        }
      });

      return rootComments;
    } catch (error) {
      console.error('Error getting post comments:', error);
      throw error;
    }
  }

  /**
   * 댓글 삭제
   */
  async deleteComment(commentId: string, authorId: string): Promise<void> {
    try {
      const commentDoc = await getDoc(doc(db, 'club_post_comments', commentId));

      if (!commentDoc.exists()) {
        throw new Error(i18n.t('services.clubComms.commentNotFound'));
      }

      const comment = commentDoc.data() as PostComment;

      if (comment.authorId !== authorId) {
        throw new Error(i18n.t('services.clubComms.permissionDenied'));
      }

      const batch = writeBatch(db);

      // 댓글을 삭제 상태로 변경 (실제 삭제하지 않음)
      batch.update(doc(db, 'club_post_comments', commentId), {
        isDeleted: true,
        content: '삭제된 댓글입니다.',
        updatedAt: serverTimestamp(),
      });

      // 게시글 댓글 수 감소
      const postRef = doc(db, 'club_posts', comment.postId);
      batch.update(postRef, {
        commentCount: increment(-1),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      console.log('✅ Comment deleted:', commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // ========================
  // 채팅 관련
  // ========================

  /**
   * 메시지 전송
   */
  async sendMessage(
    request: SendMessageRequest,
    userId: string,
    userName: string,
    userAvatar?: string
  ): Promise<string> {
    try {
      const messageData: Omit<ChatMessage, 'id'> = {
        clubId: request.clubId,
        text: request.text,
        userId,
        userName,
        userAvatar,
        createdAt: serverTimestamp() as Timestamp,
        type: request.type || 'text',
        replyTo: request.replyTo,
      };

      const messagesRef = collection(db, 'club_chats', request.clubId, 'messages');
      const docRef = await addDoc(messagesRef, messageData);

      console.log('✅ Message sent:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * 채팅 메시지 목록 조회
   */
  async getChatMessages(clubId: string, limitCount: number = 50): Promise<ChatMessage[]> {
    try {
      const messagesRef = collection(db, 'club_chats', clubId, 'messages');
      const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(limitCount));

      const snapshot = await getDocs(q);

      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ChatMessage[];

      // 시간순으로 정렬 (최신순 -> 오래된순)
      return messages.reverse();
    } catch (error) {
      console.error('Error getting chat messages:', error);
      throw error;
    }
  }

  /**
   * 채팅 메시지 실시간 리스너
   */
  listenToChatMessages(
    clubId: string,
    callback: (messages: ChatMessage[]) => void,
    limitCount: number = 50
  ): Unsubscribe {
    const messagesRef = collection(db, 'club_chats', clubId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(limitCount));

    return onSnapshot(
      q,
      snapshot => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ChatMessage[];

        // 시간순으로 정렬
        callback(messages.reverse());
      },
      error => {
        console.error('Error in chat messages listener:', error);
      }
    );
  }

  /**
   * 게시글 목록 실시간 리스너
   */
  listenToClubPosts(
    clubId: string,
    callback: (posts: ClubPost[]) => void,
    limitCount: number = 20
  ): Unsubscribe {
    const postsRef = collection(db, 'club_posts');
    const q = query(
      postsRef,
      where('clubId', '==', clubId),
      orderBy('isPinned', 'desc'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      snapshot => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as ClubPost[];

        callback(posts);
      },
      error => {
        console.error('Error in posts listener:', error);
      }
    );
  }

  /**
   * 특정 게시글 실시간 리스너
   */
  listenToPost(postId: string, callback: (post: ClubPost | null) => void): Unsubscribe {
    const postRef = doc(db, 'club_posts', postId);

    return onSnapshot(
      postRef,
      snapshot => {
        if (snapshot.exists()) {
          callback({
            id: snapshot.id,
            ...snapshot.data(),
          } as ClubPost);
        } else {
          callback(null);
        }
      },
      error => {
        console.error('Error in post listener:', error);
      }
    );
  }

  /**
   * 댓글 실시간 리스너
   */
  listenToPostComments(postId: string, callback: (comments: PostComment[]) => void): Unsubscribe {
    const commentsRef = collection(db, 'club_post_comments');
    const q = query(
      commentsRef,
      where('postId', '==', postId),
      where('isDeleted', '!=', true),
      orderBy('createdAt', 'asc')
    );

    return onSnapshot(
      q,
      snapshot => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as PostComment[];

        // 댓글 구조화 (부모-자식 관계)
        const commentMap = new Map<string, PostComment>();
        const rootComments: PostComment[] = [];

        comments.forEach(comment => {
          comment.replies = [];
          commentMap.set(comment.id, comment);

          if (!comment.parentCommentId) {
            rootComments.push(comment);
          }
        });

        comments.forEach(comment => {
          if (comment.parentCommentId) {
            const parentComment = commentMap.get(comment.parentCommentId);
            if (parentComment) {
              parentComment.replies!.push(comment);
            }
          }
        });

        callback(rootComments);
      },
      error => {
        console.error('Error in comments listener:', error);
      }
    );
  }

  // ========================
  // 통계 및 유틸리티
  // ========================

  /**
   * 클럽 커뮤니케이션 통계 조회
   */
  async getCommunicationStats(clubId: string): Promise<CommunicationStats> {
    try {
      // 병렬로 각 통계 조회
      const [postsSnapshot, commentsSnapshot, messagesSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'club_posts'), where('clubId', '==', clubId))),
        getDocs(query(collection(db, 'club_post_comments'), where('clubId', '==', clubId))),
        getDocs(collection(db, 'club_chats', clubId, 'messages')),
      ]);

      return {
        clubId,
        totalPosts: postsSnapshot.size,
        totalComments: commentsSnapshot.size,
        totalMessages: messagesSnapshot.size,
        activeMembers: 0, // TODO: 실제 활성 멤버 수 계산
        lastActivityAt: serverTimestamp() as Timestamp,
      };
    } catch (error) {
      console.error('Error getting communication stats:', error);
      throw error;
    }
  }

  /**
   * 채팅방 정보 조회
   */
  async getChatRoomInfo(clubId: string): Promise<ChatRoomInfo | null> {
    try {
      // 클럽 정보 조회
      const clubDoc = await getDoc(doc(db, 'clubs', clubId));
      if (!clubDoc.exists()) {
        return null;
      }

      const clubData = clubDoc.data();

      // 최근 메시지 조회
      const messagesRef = collection(db, 'club_chats', clubId, 'messages');
      const lastMessageQuery = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));

      const lastMessageSnapshot = await getDocs(lastMessageQuery);
      let lastMessage = undefined;

      if (!lastMessageSnapshot.empty) {
        const messageData = lastMessageSnapshot.docs[0].data() as ChatMessage;
        lastMessage = {
          text: messageData.text,
          userName: messageData.userName,
          createdAt: messageData.createdAt,
        };
      }

      return {
        clubId,
        clubName: clubData.name || 'Unknown Club',
        memberCount: clubData.memberCount || 0,
        lastMessage,
        unreadCount: 0, // TODO: 실제 읽지 않은 메시지 수 계산
      };
    } catch (error) {
      console.error('Error getting chat room info:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const clubCommsService = new ClubCommunicationsService();
export default clubCommsService;
