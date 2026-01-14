/**
 * Business Card Component
 * Displays pickleball business information with partnership details and booking options
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { useAuth } from '../../contexts/AuthContext';
import { formatPriceByCountry } from '../../utils/currencyUtils';

interface BusinessData {
  id: string;
  name: string;
  description: string;
  type: 'coach' | 'pro_shop' | 'academy' | 'court_rental';
  contactInfo: {
    email: string;
    phone: string;
    website?: string;
    address: string;
  };
  services: Array<{
    id: string;
    name: string;
    description: string;
    duration: number;
    basePrice: number;
  }>;
  specialties: string[];
  partnership: {
    isActive: boolean;
    generalDiscount: number;
    specialOffers: Array<{
      title: string;
      description: string;
      discount: number;
      validUntil: string;
    }>;
  };
  images: string[];
  logo?: string;
  certifications: string[];
  stats: {
    averageRating: number;
    totalReviews: number;
    totalBookings: number;
  };
  distance?: number;
}

interface BusinessCardProps {
  business: BusinessData;
  showBookingButton?: boolean;
  showPartnershipInfo?: boolean;
  isClubMember?: boolean;
  clubDiscount?: number;
  onBookService?: (businessId: string, serviceId: string) => void;
  onViewDetails?: (businessId: string) => void;
  onContact?: (businessId: string, contactMethod: string) => void;
}

const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  showBookingButton = true,
  showPartnershipInfo = false,
  isClubMember = false,
  clubDiscount = 0,
  onBookService,
  onViewDetails,
  onContact,
}) => {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const userCountry = currentUser?.profile?.location?.country;

  const getBusinessTypeIcon = (type: string) => {
    switch (type) {
      case 'coach':
        return 'person';
      case 'pro_shop':
        return 'storefront';
      case 'academy':
        return 'school';
      case 'court_rental':
        return 'pickleballball';
      default:
        return 'business';
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case 'coach':
        return 'Pickleball Coach';
      case 'pro_shop':
        return 'Pro Shop';
      case 'academy':
        return 'Pickleball Academy';
      case 'court_rental':
        return 'Court Rental';
      default:
        return 'Pickleball Business';
    }
  };

  // 🌍 국가별 화폐로 가격 포맷팅
  const formatPrice = (price: number, discount: number = 0) => {
    const discountedPrice = price * (1 - discount / 100);
    if (discount > 0) {
      return (
        <View style={styles.priceContainer}>
          <Text style={styles.originalPrice}>{formatPriceByCountry(price, userCountry)}</Text>
          <Text style={styles.discountedPrice}>
            {formatPriceByCountry(discountedPrice, userCountry)}
          </Text>
          <Text style={styles.discountBadge}>-{discount}%</Text>
        </View>
      );
    }
    return <Text style={styles.price}>{formatPriceByCountry(price, userCountry)}</Text>;
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

  const handleServiceBooking = (serviceId: string) => {
    Alert.alert(t('business.bookService.title'), t('business.bookService.confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.bookNow'),
        onPress: () => onBookService?.(business.id, serviceId),
      },
    ]);
  };

  const handleContact = (method: string) => {
    switch (method) {
      case 'phone':
        onContact?.(business.id, 'phone');
        break;
      case 'email':
        onContact?.(business.id, 'email');
        break;
      case 'website':
        onContact?.(business.id, 'website');
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.businessInfo}>
          <View style={styles.logoContainer}>
            {business.logo ? (
              <Image source={{ uri: business.logo }} style={styles.logo} />
            ) : (
              <View style={styles.logoPlaceholder}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <Ionicons name={getBusinessTypeIcon(business.type) as any} size={24} color='#666' />
              </View>
            )}
            <View style={[styles.typeBadge, getBusinessTypeStyle(business.type)]}>
              <Text style={styles.typeText}>{getBusinessTypeLabel(business.type)}</Text>
            </View>
          </View>

          <View style={styles.businessDetails}>
            <Text style={styles.businessName} numberOfLines={2}>
              {business.name}
            </Text>
            <Text style={styles.businessDescription} numberOfLines={2}>
              {business.description}
            </Text>

            {/* Rating and Reviews */}
            <View style={styles.ratingContainer}>
              <View style={styles.stars}>{renderStarRating(business.stats.averageRating)}</View>
              <Text style={styles.ratingText}>
                {business.stats.averageRating.toFixed(1)} ({business.stats.totalReviews} reviews)
              </Text>
            </View>

            {/* Distance */}
            {business.distance !== undefined && (
              <View style={styles.distanceContainer}>
                <Ionicons name='location' size={14} color='#666' />
                <Text style={styles.distanceText}>{business.distance}km away</Text>
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.expandButton} onPress={() => setExpanded(!expanded)}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color='#666' />
        </TouchableOpacity>
      </View>

      {/* Partnership Information */}
      {showPartnershipInfo && business.partnership.isActive && (
        <View style={styles.partnershipSection}>
          <View style={styles.partnershipHeader}>
            <Ionicons name='ribbon' size={16} color='#4CAF50' />
            <Text style={styles.partnershipTitle}>Club Partner Benefits</Text>
          </View>

          {isClubMember && clubDiscount > 0 && (
            <View style={styles.clubDiscountBadge}>
              <Text style={styles.clubDiscountText}>{clubDiscount}% Club Member Discount</Text>
            </View>
          )}

          {business.partnership.specialOffers.length > 0 && (
            <ScrollView
              horizontal
              style={styles.offersContainer}
              showsHorizontalScrollIndicator={false}
            >
              {business.partnership.specialOffers.map((offer, index) => (
                <View key={index} style={styles.offerCard}>
                  <Text style={styles.offerTitle}>{offer.title}</Text>
                  <Text style={styles.offerDescription} numberOfLines={2}>
                    {offer.description}
                  </Text>
                  <Text style={styles.offerDiscount}>-{offer.discount}% OFF</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Expanded Content */}
      {expanded && (
        <View style={styles.expandedContent}>
          {/* Specialties */}
          {business.specialties.length > 0 && (
            <View style={styles.specialtiesSection}>
              <Text style={styles.sectionTitle}>Specialties</Text>
              <View style={styles.specialtiesContainer}>
                {business.specialties.map((specialty, index) => (
                  <View key={index} style={styles.specialtyTag}>
                    <Text style={styles.specialtyText}>{specialty}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Services */}
          {business.services.length > 0 && (
            <View style={styles.servicesSection}>
              <Text style={styles.sectionTitle}>Services</Text>
              {business.services.slice(0, 3).map(service => (
                <View key={service.id} style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.serviceDescription} numberOfLines={1}>
                      {service.description}
                    </Text>
                    <Text style={styles.serviceDuration}>{service.duration} minutes</Text>
                  </View>

                  <View style={styles.servicePricing}>
                    {formatPrice(
                      service.basePrice,
                      isClubMember ? clubDiscount : business.partnership.generalDiscount
                    )}

                    {showBookingButton && (
                      <TouchableOpacity
                        style={styles.bookButton}
                        onPress={() => handleServiceBooking(service.id)}
                      >
                        <Text style={styles.bookButtonText}>Book</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}

              {business.services.length > 3 && (
                <TouchableOpacity
                  style={styles.viewMoreServices}
                  onPress={() => onViewDetails?.(business.id)}
                >
                  <Text style={styles.viewMoreText}>
                    View all {business.services.length} services
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactOptions}>
              <TouchableOpacity style={styles.contactButton} onPress={() => handleContact('phone')}>
                <Ionicons name='call' size={16} color='#2196F3' />
                <Text style={styles.contactButtonText}>Call</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.contactButton} onPress={() => handleContact('email')}>
                <Ionicons name='mail' size={16} color='#2196F3' />
                <Text style={styles.contactButtonText}>Email</Text>
              </TouchableOpacity>

              {business.contactInfo.website && (
                <TouchableOpacity
                  style={styles.contactButton}
                  onPress={() => handleContact('website')}
                >
                  <Ionicons name='globe' size={16} color='#2196F3' />
                  <Text style={styles.contactButtonText}>Website</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.address} numberOfLines={2}>
              {business.contactInfo.address}
            </Text>
          </View>

          {/* Certifications */}
          {business.certifications.length > 0 && (
            <View style={styles.certificationsSection}>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <View style={styles.certificationsContainer}>
                {business.certifications.map((cert, index) => (
                  <View key={index} style={styles.certificationBadge}>
                    <Ionicons name='ribbon' size={12} color='#FF9800' />
                    <Text style={styles.certificationText}>{cert}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, styles.detailsButton]}
          onPress={() => onViewDetails?.(business.id)}
        >
          <Ionicons name='information-circle' size={18} color='#666' />
          <Text style={styles.actionButtonText}>Details</Text>
        </TouchableOpacity>

        {showBookingButton && (
          <TouchableOpacity
            style={[styles.actionButton, styles.bookMainButton]}
            onPress={() =>
              business.services.length > 0 && handleServiceBooking(business.services[0].id)
            }
          >
            <Ionicons name='calendar' size={18} color='white' />
            <Text style={styles.bookMainButtonText}>Book Now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const getBusinessTypeStyle = (type: string) => {
  switch (type) {
    case 'coach':
      return { backgroundColor: '#4CAF50' };
    case 'pro_shop':
      return { backgroundColor: '#2196F3' };
    case 'academy':
      return { backgroundColor: '#9C27B0' };
    case 'court_rental':
      return { backgroundColor: '#FF9800' };
    default:
      return { backgroundColor: '#666' };
  }
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
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  businessInfo: {
    flex: 1,
    flexDirection: 'row',
  },
  logoContainer: {
    position: 'relative',
    marginRight: 12,
  },
  logo: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  logoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'white',
  },
  typeText: {
    fontSize: 8,
    fontWeight: '600',
    color: 'white',
  },
  businessDetails: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  businessDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stars: {
    flexDirection: 'row',
    marginRight: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 2,
  },
  expandButton: {
    padding: 4,
  },
  partnershipSection: {
    backgroundColor: '#f8fff8',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  partnershipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partnershipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginLeft: 6,
  },
  clubDiscountBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  clubDiscountText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  offersContainer: {
    flexDirection: 'row',
  },
  offerCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    marginRight: 8,
    width: 150,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  offerTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  offerDescription: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
  },
  offerDiscount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F44336',
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
  specialtiesSection: {
    marginBottom: 16,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  servicesSection: {
    marginBottom: 16,
  },
  serviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  serviceInfo: {
    flex: 1,
    marginRight: 12,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  serviceDuration: {
    fontSize: 11,
    color: '#999',
  },
  servicePricing: {
    alignItems: 'flex-end',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  originalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
  },
  discountedPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4CAF50',
  },
  discountBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F44336',
  },
  bookButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  bookButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  viewMoreServices: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  contactSection: {
    marginBottom: 16,
  },
  contactOptions: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  contactButtonText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
  },
  address: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  certificationsSection: {
    marginBottom: 8,
  },
  certificationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  certificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3e0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  certificationText: {
    fontSize: 10,
    color: '#ef6c00',
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
  detailsButton: {
    backgroundColor: '#f5f5f5',
  },
  bookMainButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  bookMainButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
});

export default BusinessCard;
