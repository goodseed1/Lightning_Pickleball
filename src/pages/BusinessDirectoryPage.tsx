/**
 * Business Directory Page
 * Browse local tennis businesses and partnerships
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import businessService from '../services/businessService';
import { Business, Coach, ProShop, Partnership } from '../types/business';

// Components
import BusinessCard from '../components/business/BusinessCard';
import PartnershipCard from '../components/business/PartnershipCard';
import BusinessRegistrationForm from '../components/business/BusinessRegistrationForm';

const Tab = createMaterialTopTabNavigator();

interface BusinessDirectoryPageProps {
  navigation?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}

const BusinessDirectoryPage: React.FC<BusinessDirectoryPageProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    type: '',
    distance: 25,
    minRating: 0,
    sortBy: 'distance',
  });
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);

  // All Businesses Tab
  const AllBusinessesTab = () => {
    const { t } = useTranslation();
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const loadBusinesses = useCallback(async () => {
      try {
        setLoading(true);
        const results = await businessService.searchBusinesses({
          type: selectedFilters.type || undefined,
          location: { lat: 33.749, lng: -84.388 }, // Atlanta coordinates
          radius: selectedFilters.distance,
          minRating: selectedFilters.minRating,
          sortBy: selectedFilters.sortBy,
        });
        setBusinesses(results);
      } catch (error) {
        console.error('Failed to load businesses:', error);
      } finally {
        setLoading(false);
      }
    }, [selectedFilters]);

    useEffect(() => {
      loadBusinesses();
    }, [loadBusinesses]);

    const handleRefresh = async () => {
      setRefreshing(true);
      try {
        await loadBusinesses();
      } catch {
        Alert.alert(t('common.error'), t('business.error.refreshFailed'));
      } finally {
        setRefreshing(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleBookService = (_businessId: string, _serviceId: string) => {
      Alert.alert(t('business.bookService.title'), t('business.bookService.comingSoon'), [
        { text: 'OK' },
      ]);
    };

    const handleContact = (businessId: string, method: string) => {
      const business = businesses.find(b => b.id === businessId);
      if (!business) return;

      switch (method) {
        case 'phone':
          Alert.alert(t('business.contact.call'), `${business.contactInfo.phone}`);
          break;
        case 'email':
          Alert.alert(t('business.contact.email'), `${business.contactInfo.email}`);
          break;
        case 'website':
          if (business.contactInfo.website) {
            Alert.alert(t('business.contact.website'), `${business.contactInfo.website}`);
          }
          break;
      }
    };

    const handleViewDetails = (businessId: string) => {
      // Navigate to business detail page
      console.log('View business details:', businessId);
    };

    return (
      <View style={styles.tabContainer}>
        <ScrollView
          style={styles.businessList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor='#2196F3' />
          }
          showsVerticalScrollIndicator={false}
        >
          {businesses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name='storefront' size={64} color='#ccc' />
              <Text style={styles.emptyTitle}>No businesses found</Text>
              <Text style={styles.emptyDescription}>
                Try adjusting your search criteria or check back later
              </Text>
            </View>
          ) : (
            businesses.map(business => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const businessData = business as any;
              return (
                <BusinessCard
                  key={business.id}
                  business={businessData}
                  showBookingButton={true}
                  showPartnershipInfo={business.partnership?.isActive}
                  isClubMember={false}
                  onBookService={handleBookService}
                  onViewDetails={handleViewDetails}
                  onContact={handleContact}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  // Coaches Tab
  const CoachesTab = () => {
    const { t } = useTranslation();
    const [coaches, setCoaches] = useState<Coach[]>([]);
    const [, setLoading] = useState(false);

    useEffect(() => {
      loadCoaches();
    }, []);

    const loadCoaches = async () => {
      try {
        setLoading(true);
        const results = await businessService.searchBusinesses({
          type: 'coach',
          location: { lat: 33.749, lng: -84.388 },
          radius: selectedFilters.distance,
          sortBy: 'rating',
        });
        setCoaches(results);
      } catch (error) {
        console.error('Failed to load coaches:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.tabContainer}>
        <ScrollView style={styles.businessList}>
          {coaches.map(coach => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const coachData = coach as any;
            return (
              <BusinessCard
                key={coach.id}
                business={coachData}
                showBookingButton={true}
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                onBookService={(_businessId, _serviceId) => {
                  Alert.alert(t('business.bookLesson.title'), t('business.bookLesson.comingSoon'));
                }}
                onViewDetails={_businessId => console.log('View coach:', _businessId)}
                onContact={(_businessId, _method) => console.log('Contact coach:', _method)}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Pro Shops Tab
  const ProShopsTab = () => {
    const [proShops, setProShops] = useState<ProShop[]>([]);
    const [, setLoading] = useState(false);

    useEffect(() => {
      loadProShops();
    }, []);

    const loadProShops = async () => {
      try {
        setLoading(true);
        const results = await businessService.searchBusinesses({
          type: 'pro_shop',
          location: { lat: 33.749, lng: -84.388 },
          radius: selectedFilters.distance,
          sortBy: 'rating',
        });
        setProShops(results);
      } catch (error) {
        console.error('Failed to load pro shops:', error);
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.tabContainer}>
        <ScrollView style={styles.businessList}>
          {proShops.map(shop => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const shopData = shop as any;
            return (
              <BusinessCard
                key={shop.id}
                business={shopData}
                showBookingButton={false}
                onViewDetails={_businessId => console.log('View shop:', _businessId)}
                onContact={(_businessId, _method) => console.log('Contact shop:', _method)}
              />
            );
          })}
        </ScrollView>
      </View>
    );
  };

  // Partnerships Tab
  const PartnershipsTab = () => {
    const [partnerships, setPartnerships] = useState<Partnership[]>([]);
    const [, setLoading] = useState(false);

    useEffect(() => {
      loadPartnerships();
    }, []);

    const loadPartnerships = async () => {
      try {
        setLoading(true);
        // Mock partnerships data
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mockPartnerships: any = [
          {
            id: 'partnership_1',
            businessId: 'business_1',
            clubId: 'club_1',
            business: {
              name: 'Pro Tennis Academy',
              type: 'coach',
              logo: null,
              contactInfo: {
                phone: '(404) 555-0123',
                email: 'info@protennisacademy.com',
                address: '123 Tennis Way, Atlanta, GA',
              },
              stats: {
                averageRating: 4.8,
                totalReviews: 156,
              },
            },
            discount: 20,
            services: ['Private Lessons', 'Group Classes', 'Court Rental'],
            title: '20% Discount for Club Members',
            description:
              'Professional tennis coaching with certified instructors. Special rates for Lightning Tennis club members.',
            specialOffers: [
              {
                title: 'New Student Special',
                description: 'First lesson free with package purchase',
                discount: 100,
                validUntil: '2024-12-31',
              },
            ],
            status: 'accepted',
            validUntil: '2024-12-31',
            usage: {
              totalClaims: 45,
              membersClaimed: ['user1', 'user2', 'user3'],
              monthlyUsage: { '2024-01': 12 },
            },
          },
        ];
        setPartnerships(mockPartnerships);
      } catch (error) {
        console.error('Failed to load partnerships:', error);
      } finally {
        setLoading(false);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleClaimOffer = (_partnershipId: string, _offerId?: string) => {
      Alert.alert(
        'Offer Claimed!',
        'The business has been notified. They will contact you shortly with details.',
        [{ text: 'OK' }]
      );
    };

    return (
      <View style={styles.tabContainer}>
        <ScrollView style={styles.businessList}>
          {partnerships.length === 0 ? (
            <View style={styles.emptyContainer}>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Ionicons name={'people' as any} size={64} color='#ccc' />
              <Text style={styles.emptyTitle}>No partnerships available</Text>
              <Text style={styles.emptyDescription}>
                Check back later for exclusive club member deals
              </Text>
            </View>
          ) : (
            partnerships.map(partnership => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const partnershipData = partnership as any;
              return (
                <PartnershipCard
                  key={partnership.id}
                  partnership={partnershipData}
                  isClubAdmin={false}
                  isMember={true}
                  onClaimOffer={handleClaimOffer}
                  onContactBusiness={(_businessId, _method) =>
                    console.log('Contact business:', _businessId, _method)
                  }
                  onViewBusiness={_businessId => console.log('View business:', _businessId)}
                />
              );
            })
          )}
        </ScrollView>
      </View>
    );
  };

  const { t } = useTranslation();

  if (showRegistrationForm) {
    return (
      <SafeAreaView style={styles.container}>
        <BusinessRegistrationForm
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          onSuccess={_businessId => {
            setShowRegistrationForm(false);
            Alert.alert(t('common.success'), t('business.registration.success'));
          }}
          onCancel={() => setShowRegistrationForm(false)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tennis Business Directory</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowRegistrationForm(true)}
          >
            <Ionicons name='add-circle' size={24} color='#2196F3' />
            <Text style={styles.headerButtonText}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name='search' size={20} color='#666' />
          <TextInput
            style={styles.searchInput}
            placeholder='Search tennis businesses...'
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType='search'
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name='close-circle' size={20} color='#666' />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          <TouchableOpacity
            style={[styles.filterButton, selectedFilters.type === 'coach' && styles.activeFilter]}
            onPress={() =>
              setSelectedFilters(prev => ({
                ...prev,
                type: prev.type === 'coach' ? '' : 'coach',
              }))
            }
          >
            <Text
              style={[
                styles.filterText,
                selectedFilters.type === 'coach' && styles.activeFilterText,
              ]}
            >
              Coaches
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilters.type === 'pro_shop' && styles.activeFilter,
            ]}
            onPress={() =>
              setSelectedFilters(prev => ({
                ...prev,
                type: prev.type === 'pro_shop' ? '' : 'pro_shop',
              }))
            }
          >
            <Text
              style={[
                styles.filterText,
                selectedFilters.type === 'pro_shop' && styles.activeFilterText,
              ]}
            >
              Pro Shops
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, selectedFilters.distance === 10 && styles.activeFilter]}
            onPress={() =>
              setSelectedFilters(prev => ({
                ...prev,
                distance: prev.distance === 10 ? 25 : 10,
              }))
            }
          >
            <Text
              style={[
                styles.filterText,
                selectedFilters.distance === 10 && styles.activeFilterText,
              ]}
            >
              Within 10km
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              selectedFilters.sortBy === 'rating' && styles.activeFilter,
            ]}
            onPress={() =>
              setSelectedFilters(prev => ({
                ...prev,
                sortBy: prev.sortBy === 'rating' ? 'distance' : 'rating',
              }))
            }
          >
            <Text
              style={[
                styles.filterText,
                selectedFilters.sortBy === 'rating' && styles.activeFilterText,
              ]}
            >
              Top Rated
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Tab Navigator */}
      <Tab.Navigator
        screenOptions={{
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
            textTransform: 'none',
          },
          tabBarActiveTintColor: '#2196F3',
          tabBarInactiveTintColor: '#666',
          tabBarIndicatorStyle: {
            backgroundColor: '#2196F3',
            height: 3,
          },
          tabBarStyle: {
            backgroundColor: 'white',
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarScrollEnabled: true,
          tabBarItemStyle: {
            width: 'auto',
            minWidth: 80,
          },
        }}
      >
        <Tab.Screen
          name='All'
          component={AllBusinessesTab}
          options={{
            title: 'All Businesses',
            tabBarIcon: ({ color }) => <Ionicons name='storefront' size={18} color={color} />,
          }}
        />

        <Tab.Screen
          name='Coaches'
          component={CoachesTab}
          options={{
            title: 'Coaches',
            tabBarIcon: ({ color }) => <Ionicons name='person' size={18} color={color} />,
          }}
        />

        <Tab.Screen
          name='ProShops'
          component={ProShopsTab}
          options={{
            title: 'Pro Shops',
            tabBarIcon: ({ color }) => <Ionicons name='storefront' size={18} color={color} />,
          }}
        />

        <Tab.Screen
          name='Partnerships'
          component={PartnershipsTab}
          options={{
            title: 'Club Partners',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            tabBarIcon: ({ color }) => <Ionicons name={'people' as any} size={18} color={color} />,
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  headerButtonText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginLeft: 4,
  },
  searchContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: '#333',
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  activeFilterText: {
    color: 'white',
  },
  tabContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  businessList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default BusinessDirectoryPage;
