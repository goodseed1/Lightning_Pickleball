/**
 * ServiceCard - 테니스 서비스 게시판 카드 컴포넌트
 * 줄 교체, 라켓 수리, 중고 거래 등 서비스 정보를 표시
 */

import React, { useState } from 'react';
import { View, StyleSheet, Alert, Image, ScrollView, Dimensions } from 'react-native';
import { Card, Text, Avatar, IconButton, Button } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { getLightningTennisTheme } from '../../theme';
import { TennisService, ServiceCategory } from '../../types/tennisService';
import { formatDistance } from '../../utils/unitUtils';
import { formatPriceByCountry } from '../../utils/currencyUtils';
import clubService from '../../services/clubService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = SCREEN_WIDTH - 56; // Card padding + margins

interface ServiceCardProps {
  service: TennisService;
  onEdit?: (service: TennisService) => void;
  onDelete?: (serviceId: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onEdit, onDelete }) => {
  const { t } = useLanguage();
  const { theme: currentTheme } = useTheme();
  const { currentUser } = useAuth();
  const navigation = useNavigation();
  const themeColors = getLightningTennisTheme(currentTheme);
  const colors = themeColors.colors as unknown as Record<string, string>;

  const isOwner = currentUser?.uid === service.authorId;
  const userCountry = currentUser?.profile?.location?.country;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // 카테고리 라벨
  const getCategoryLabel = (category?: ServiceCategory) => {
    if (!category) return null;
    const categoryKey = `serviceCard.category.${category}` as const;
    return t(categoryKey);
  };

  // 🌍 가격 포맷팅 (작성자의 국가 기반으로 화폐 결정)
  const authorCountry = service.coordinates?.country;
  // 작성자 국가가 있으면 작성자 국가 기준, 없으면 현재 사용자 국가 기준
  const priceCountry = authorCountry || userCountry;

  const formatPrice = (price: number) => {
    return formatPriceByCountry(price, priceCountry);
  };

  // 작성자에게 연락하기
  const handleContact = () => {
    if (!currentUser || currentUser.uid === service.authorId) {
      return;
    }

    const conversationId = clubService.getConversationId(currentUser.uid, service.authorId);

    // @ts-expect-error - navigation type
    navigation.navigate('DirectChatRoom', {
      conversationId,
      otherUserId: service.authorId,
      otherUserName: service.authorName,
      otherUserPhotoURL: service.authorPhotoURL || '',
    });
  };

  // 삭제 확인
  const handleDeletePress = () => {
    Alert.alert(t('serviceCard.deleteTitle'), t('serviceCard.deleteMessage'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => onDelete?.(service.id),
      },
    ]);
  };

  // 이미지 스크롤 핸들러
  const handleImageScroll = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / IMAGE_SIZE);
    setCurrentImageIndex(index);
  };

  return (
    <Card style={[styles.card, { backgroundColor: colors.surface }]}>
      {/* 헤더: 작성자 정보 + 버튼 */}
      <View style={styles.header}>
        <View style={styles.authorSection}>
          {service.authorPhotoURL ? (
            <Avatar.Image size={40} source={{ uri: service.authorPhotoURL }} />
          ) : (
            <Avatar.Text
              size={40}
              label={service.authorName.charAt(0).toUpperCase()}
              style={{ backgroundColor: colors.primaryContainer }}
            />
          )}
          <View style={styles.authorInfo}>
            <Text style={[styles.authorName, { color: colors.onSurface }]}>
              {service.authorName}
            </Text>
            {service.category && (
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {getCategoryLabel(service.category)}
              </Text>
            )}
          </View>
        </View>

        {isOwner ? (
          <View style={styles.actionButtons}>
            <IconButton
              icon='pencil'
              size={20}
              iconColor={colors.onSurfaceVariant}
              onPress={() => onEdit?.(service)}
            />
            <IconButton
              icon='delete'
              size={20}
              iconColor={colors.error}
              onPress={handleDeletePress}
            />
          </View>
        ) : (
          <Button
            mode='contained'
            compact
            onPress={handleContact}
            style={styles.contactButton}
            labelStyle={styles.contactButtonLabel}
          >
            {t('serviceCard.contact')}
          </Button>
        )}
      </View>

      {/* 제목 및 설명 */}
      <View style={styles.contentSection}>
        <Text style={[styles.title, { color: colors.onSurface }]}>{service.title}</Text>
        {service.description && (
          <Text style={[styles.description, { color: colors.onSurfaceVariant }]} numberOfLines={3}>
            {service.description}
          </Text>
        )}
      </View>

      {/* 이미지 갤러리 */}
      {service.images && service.images.length > 0 && (
        <View style={styles.imageSection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleImageScroll}
            scrollEventThrottle={16}
          >
            {service.images.map((imageUrl, index) => (
              <Image
                key={index}
                source={{ uri: imageUrl }}
                style={[styles.image, { width: IMAGE_SIZE, height: IMAGE_SIZE * 0.75 }]}
                resizeMode='cover'
              />
            ))}
          </ScrollView>
          {service.images.length > 1 && (
            <View style={styles.imageIndicator}>
              {service.images.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        index === currentImageIndex ? colors.primary : colors.outline,
                    },
                  ]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* 정보 섹션 */}
      {(service.price !== undefined || service.distance !== undefined) && (
        <View style={[styles.infoSection, { borderTopColor: colors.outline }]}>
          {/* 가격 */}
          {service.price !== undefined && (
            <View style={styles.infoRow}>
              <Ionicons name='pricetag-outline' size={18} color={colors.primary} />
              <Text style={[styles.priceText, { color: colors.onSurface }]}>
                {formatPrice(service.price)}
              </Text>
            </View>
          )}

          {/* 거리 */}
          {service.distance !== undefined && service.distance !== null && (
            <View style={styles.infoRow}>
              <Ionicons name='location-outline' size={18} color={colors.primary} />
              <Text style={[styles.infoText, { color: colors.onSurfaceVariant }]}>
                {formatDistance(service.distance, userCountry)}
              </Text>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorInfo: {
    marginLeft: 12,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryText: {
    fontSize: 11,
    marginTop: 2,
  },
  contactButton: {
    borderRadius: 8,
  },
  contactButtonLabel: {
    fontSize: 12,
    marginHorizontal: 4,
  },
  actionButtons: {
    flexDirection: 'row',
  },
  contentSection: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  imageSection: {
    marginBottom: 12,
  },
  image: {
    marginHorizontal: 12,
    borderRadius: 8,
  },
  imageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  infoSection: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
  },
});

export default ServiceCard;
