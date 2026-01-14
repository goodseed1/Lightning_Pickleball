/**
 * Partnership Card Component
 * Displays club partnership details with discounts and special offers
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface PartnershipOffer {
  title: string;
  description: string;
  discount: number;
  validUntil: string;
  termsAndConditions?: string;
}

interface PartnershipData {
  id: string;
  businessId: string;
  clubId: string;
  business: {
    name: string;
    type: 'coach' | 'pro_shop' | 'academy' | 'court_rental';
    logo?: string;
    contactInfo: {
      phone: string;
      email: string;
      address: string;
    };
    stats: {
      averageRating: number;
      totalReviews: number;
    };
  };
  discount: number;
  services: string[];
  title: string;
  description: string;
  specialOffers: PartnershipOffer[];
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  validUntil: any;
  usage: {
    totalClaims: number;
    membersClaimed: string[];
    monthlyUsage: Record<string, number>;
  };
}

interface PartnershipCardProps {
  partnership: PartnershipData;
  isClubAdmin?: boolean;
  isMember?: boolean;
  onAcceptPartnership?: (partnershipId: string) => void;
  onRejectPartnership?: (partnershipId: string) => void;
  onClaimOffer?: (partnershipId: string, offerId?: string) => void;
  onContactBusiness?: (businessId: string, method: string) => void;
  onViewBusiness?: (businessId: string) => void;
}

const PartnershipCard: React.FC<PartnershipCardProps> = ({
  partnership,
  isClubAdmin = false,
  isMember = false,
  onAcceptPartnership,
  onRejectPartnership,
  onClaimOffer,
  onContactBusiness,
  onViewBusiness,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const getBusinessTypeIcon = (type: string) => {
    switch (type) {
      case 'coach':
        return 'person';
      case 'pro_shop':
        return 'storefront';
      case 'academy':
        return 'school';
      case 'court_rental':
        return 'tennisball';
      default:
        return 'business';
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case 'coach':
        return 'Tennis Coach';
      case 'pro_shop':
        return 'Pro Shop';
      case 'academy':
        return 'Tennis Academy';
      case 'court_rental':
        return 'Court Rental';
      default:
        return 'Tennis Business';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'rejected':
        return '#F44336';
      case 'expired':
        return '#9E9E9E';
      default:
        return '#666';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'Active';
      case 'pending':
        return 'Pending Approval';
      case 'rejected':
        return 'Rejected';
      case 'expired':
        return 'Expired';
      default:
        return status;
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderStarRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<Ionicons key={i} name='star' size={12} color='#FFD700' />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<Ionicons key={i} name='star-half' size={12} color='#FFD700' />);
      } else {
        stars.push(<Ionicons key={i} name='star-outline' size={12} color='#FFD700' />);
      }
    }
    return stars;
  };

  const handleAcceptPartnership = () => {
    Alert.alert(
      'Accept Partnership',
      'Are you sure you want to accept this partnership proposal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          style: 'default',
          onPress: () => onAcceptPartnership?.(partnership.id),
        },
      ]
    );
  };

  const handleRejectPartnership = () => {
    Alert.alert(
      'Reject Partnership',
      'Are you sure you want to reject this partnership proposal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => onRejectPartnership?.(partnership.id),
        },
      ]
    );
  };

  const handleClaimOffer = (offerId?: string) => {
    Alert.alert(t('business.claimOffer.title'), t('business.claimOffer.confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.claim'),
        style: 'default',
        onPress: () => onClaimOffer?.(partnership.id, offerId),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.businessInfo}>
          <View style={styles.logoContainer}>
            {partnership.business.logo ? (
              <Image source={{ uri: partnership.business.logo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                <Ionicons
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  name={getBusinessTypeIcon(partnership.business.type) as any}
                  size={24}
                  color='#666'
                />
              </View>
            )}
          </View>

          <View style={styles.businessDetails}>
            <Text style={styles.businessName} numberOfLines={1}>
              {partnership.business.name}
            </Text>
            <Text style={styles.businessType}>
              {getBusinessTypeLabel(partnership.business.type)}
            </Text>

            {/* Rating */}
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>
                {renderStarRating(partnership.business.stats.averageRating)}
              </View>
              <Text style={styles.ratingText}>
                {partnership.business.stats.averageRating.toFixed(1)} (
                {partnership.business.stats.totalReviews})
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            {/* Status Badge */}
            <View
              style={[styles.statusBadge, { backgroundColor: getStatusColor(partnership.status) }]}
            >
              <Text style={styles.statusText}>{getStatusLabel(partnership.status)}</Text>
            </View>

            {/* Expand Button */}
            <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color='#666' />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Partnership Details */}
      <View style={styles.partnershipInfo}>
        <Text style={styles.partnershipTitle}>{partnership.title}</Text>
        <Text style={styles.partnershipDescription} numberOfLines={2}>
          {partnership.description}
        </Text>

        {/* Main Discount */}
        <View style={styles.discountContainer}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{partnership.discount}% OFF</Text>
          </View>
          <Text style={styles.discountLabel}>Club Member Discount</Text>
        </View>
      </View>

      {/* Special Offers Preview */}
      {partnership.specialOffers.length > 0 && (
        <View style={styles.offersPreview}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {partnership.specialOffers.slice(0, 2).map((offer, index) => (
              <View key={index} style={styles.offerPreviewCard}>
                <Text style={styles.offerPreviewTitle} numberOfLines={1}>
                  {offer.title}
                </Text>
                <Text style={styles.offerPreviewDiscount}>-{offer.discount}%</Text>
              </View>
            ))}
            {partnership.specialOffers.length > 2 && (
              <View style={styles.moreOffersIndicator}>
                <Text style={styles.moreOffersText}>
                  +{partnership.specialOffers.length - 2} more
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Services Included */}
          {partnership.services.length > 0 && (
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Included Services</Text>
              <View style={styles.servicesContainer}>
                {partnership.services.map((service, index) => (
                  <View key={index} style={styles.serviceTag}>
                    <Text style={styles.serviceText}>{service}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Special Offers Full List */}
          {partnership.specialOffers.length > 0 && (
            <View style={styles.offersSection}>
              <Text style={styles.sectionTitle}>Special Offers</Text>
              {partnership.specialOffers.map((offer, index) => (
                <View key={index} style={styles.offerCard}>
                  <View style={styles.offerHeader}>
                    <Text style={styles.offerTitle}>{offer.title}</Text>
                    <Text style={styles.offerDiscount}>-{offer.discount}%</Text>
                  </View>
                  <Text style={styles.offerDescription}>{offer.description}</Text>
                  <View style={styles.offerFooter}>
                    <Text style={styles.offerValidity}>
                      Valid until: {formatDate(offer.validUntil)}
                    </Text>
                    {isMember && partnership.status === 'accepted' && (
                      <TouchableOpacity
                        style={styles.claimButton}
                        onPress={() => handleClaimOffer(offer.title)}
                      >
                        <Text style={styles.claimButtonText}>Claim</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Usage Statistics */}
          {partnership.status === 'accepted' && (
            <View style={styles.usageSection}>
              <Text style={styles.sectionTitle}>Usage Statistics</Text>
              <View style={styles.usageStats}>
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>{partnership.usage.totalClaims}</Text>
                  <Text style={styles.usageLabel}>Total Claims</Text>
                </View>
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>{partnership.usage.membersClaimed.length}</Text>
                  <Text style={styles.usageLabel}>Members Used</Text>
                </View>
                <View style={styles.usageStat}>
                  <Text style={styles.usageValue}>
                    {Object.values(partnership.usage.monthlyUsage).reduce(
                      (sum, val) => sum + val,
                      0
                    )}
                  </Text>
                  <Text style={styles.usageLabel}>This Month</Text>
                </View>
              </View>
            </View>
          )}

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Business</Text>
            <View style={styles.contactOptions}>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => onContactBusiness?.(partnership.businessId, 'phone')}
              >
                <Ionicons name='call' size={16} color='#2196F3' />
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => onContactBusiness?.(partnership.businessId, 'email')}
              >
                <Ionicons name='mail' size={16} color='#2196F3' />
                <Text style={styles.contactButtonText}>Email</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.contactButton}
                onPress={() => onViewBusiness?.(partnership.businessId)}
              >
                <Ionicons name='information-circle' size={16} color='#2196F3' />
                <Text style={styles.contactButtonText}>View Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {/* Club Admin Actions */}
        {isClubAdmin && partnership.status === 'pending' && (
          <>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={handleRejectPartnership}
            >
              <Ionicons name='close' size={18} color='#F44336' />
              <Text style={styles.rejectButtonText}>Reject</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={handleAcceptPartnership}
            >
              <Ionicons name='checkmark' size={18} color='white' />
              <Text style={styles.acceptButtonText}>Accept Partnership</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Member Actions */}
        {isMember && partnership.status === 'accepted' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.claimMainButton]}
            onPress={() => handleClaimOffer()}
          >
            <Ionicons name='gift' size={18} color='white' />
            <Text style={styles.claimMainButtonText}>Claim Discount</Text>
          </TouchableOpacity>
        )}

        {/* General View Details Button */}
        {!isClubAdmin && partnership.status !== 'pending' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.detailsButton]}
            onPress={() => onViewBusiness?.(partnership.businessId)}
          >
            <Ionicons name='information-circle' size={18} color='#666' />
            <Text style={styles.detailsButtonText}>View Business</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Validity Notice */}
      {partnership.validUntil && (
        <View style={styles.validityNotice}>
          <Ionicons name='time' size={14} color='#666' />
          <Text style={styles.validityText}>Valid until: {formatDate(partnership.validUntil)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  businessInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoContainer: {
    marginRight: 12,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  logoPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  businessType: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 11,
    color: '#666',
  },
  headerActions: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  expandButton: {
    padding: 4,
  },
  partnershipInfo: {
    padding: 16,
    paddingTop: 0,
  },
  partnershipTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  partnershipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 12,
  },
  discountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'white',
  },
  discountLabel: {
    fontSize: 12,
    color: '#666',
  },
  offersPreview: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  offerPreviewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    minWidth: 120,
  },
  offerPreviewTitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  offerPreviewDiscount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F44336',
  },
  moreOffersIndicator: {
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  moreOffersText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  servicesSection: {
    marginBottom: 16,
  },
  servicesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  serviceTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  serviceText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  offersSection: {
    marginBottom: 16,
  },
  offerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  offerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  offerDiscount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F44336',
  },
  offerDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  offerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  offerValidity: {
    fontSize: 10,
    color: '#999',
  },
  claimButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  claimButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  usageSection: {
    marginBottom: 16,
  },
  usageStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  usageStat: {
    alignItems: 'center',
  },
  usageValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  usageLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  contactSection: {
    marginBottom: 16,
  },
  contactOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  contactButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 0,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  rejectButton: {
    backgroundColor: '#ffebee',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  claimMainButton: {
    backgroundColor: '#FF9800',
  },
  detailsButton: {
    backgroundColor: '#f5f5f5',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
    marginLeft: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  claimMainButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  detailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  validityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  validityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});

export default PartnershipCard;
