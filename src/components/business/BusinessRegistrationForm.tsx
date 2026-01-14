/**
 * Business Registration Form Component
 * Allows tennis coaches and shops to register their business for partnerships
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import businessService from '../../services/businessService';

interface BusinessFormData {
  name: string;
  description: string;
  type: 'coach' | 'pro_shop' | 'academy' | 'court_rental';
  email: string;
  phone: string;
  website: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  specialties: string[];
  services: Array<{
    name: string;
    description: string;
    duration: number;
    basePrice: number;
  }>;
  generalDiscount: number;
  certifications: string[];
  images: string[];
}

interface BusinessRegistrationFormProps {
  onSuccess?: (businessId: string) => void;
  onCancel?: () => void;
}

const BusinessRegistrationForm: React.FC<BusinessRegistrationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    type: 'coach',
    email: '',
    phone: '',
    website: '',
    address: '',
    specialties: [],
    services: [],
    generalDiscount: 0,
    certifications: [],
    images: [],
  });

  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const businessTypes = [
    {
      id: 'coach',
      label: 'Tennis Coach',
      icon: 'person',
      description: 'Individual coaching services',
    },
    {
      id: 'pro_shop',
      label: 'Pro Shop',
      icon: 'storefront',
      description: 'Tennis equipment and gear',
    },
    {
      id: 'academy',
      label: 'Tennis Academy',
      icon: 'school',
      description: 'Professional training facility',
    },
    {
      id: 'court_rental',
      label: 'Court Rental',
      icon: 'tennisball',
      description: 'Tennis court rental services',
    },
  ];

  const specialtyOptions = [
    'Beginners',
    'Intermediate',
    'Advanced',
    'Juniors',
    'Adults',
    'Seniors',
    'Singles',
    'Doubles',
    'Strategy',
    'Fitness',
    'Competitive',
    'Recreational',
  ];

  const certificationOptions = [
    'USPTA Certified',
    'PTR Certified',
    'ITF Certified',
    'USTA SafePlay',
    'First Aid Certified',
    'CPR Certified',
    'College Tennis Experience',
    'Professional Playing Experience',
  ];

  const steps = ['Business Info', 'Contact Details', 'Services & Pricing', 'Partnerships'];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
    }));
  };

  const handleCertificationToggle = (cert: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(cert)
        ? prev.certifications.filter(c => c !== cert)
        : [...prev.certifications, cert],
    }));
  };

  const addService = () => {
    setFormData(prev => ({
      ...prev,
      services: [
        ...prev.services,
        {
          name: '',
          description: '',
          duration: 60,
          basePrice: 0,
        },
      ],
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateService = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.map((service, i) =>
        i === index ? { ...service, [field]: value } : service
      ),
    }));
  };

  const removeService = (index: number) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return formData.name.trim() && formData.description.trim() && formData.type;
      case 1:
        return formData.email.trim() && formData.phone.trim() && formData.address.trim();
      case 2:
        return (
          formData.services.length > 0 &&
          formData.services.every(s => s.name.trim() && s.basePrice > 0)
        );
      case 3:
        return true; // Partnership step is optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      Alert.alert(t('business.form.incompleteTitle'), t('business.form.incompleteMessage'));
      return;
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const businessId = await businessService.registerBusiness(formData);

      Alert.alert(t('business.form.submittedTitle'), t('business.form.submittedMessage'), [
        {
          text: t('common.ok'),
          onPress: () => onSuccess?.(businessId),
        },
      ]);
    } catch (error: Error | unknown) {
      Alert.alert(t('business.form.failedTitle'), error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {steps.map((step, index) => (
        <View key={index} style={styles.stepContainer}>
          <View style={[styles.stepCircle, index <= currentStep && styles.activeStepCircle]}>
            {index < currentStep ? (
              <Ionicons name='checkmark' size={16} color='white' />
            ) : (
              <Text style={[styles.stepNumber, index <= currentStep && styles.activeStepNumber]}>
                {index + 1}
              </Text>
            )}
          </View>
          <Text style={[styles.stepLabel, index <= currentStep && styles.activeStepLabel]}>
            {step}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderBusinessInfoStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Business Information</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Name *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.name}
          onChangeText={text => handleInputChange('name', text)}
          placeholder='Enter your business name'
          maxLength={100}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.description}
          onChangeText={text => handleInputChange('description', text)}
          placeholder='Describe your business and services'
          multiline
          numberOfLines={4}
          maxLength={500}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Type *</Text>
        <View style={styles.businessTypes}>
          {businessTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.businessTypeCard,
                formData.type === type.id && styles.selectedBusinessType,
              ]}
              onPress={() => handleInputChange('type', type.id)}
            >
              <Ionicons
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                name={type.icon as any}
                size={24}
                color={formData.type === type.id ? '#2196F3' : '#666'}
              />
              <Text
                style={[
                  styles.businessTypeLabel,
                  formData.type === type.id && styles.selectedBusinessTypeLabel,
                ]}
              >
                {type.label}
              </Text>
              <Text style={styles.businessTypeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Specialties</Text>
        <View style={styles.checkboxContainer}>
          {specialtyOptions.map(specialty => (
            <TouchableOpacity
              key={specialty}
              style={styles.checkboxItem}
              onPress={() => handleSpecialtyToggle(specialty)}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.specialties.includes(specialty) && styles.checkedBox,
                ]}
              >
                {formData.specialties.includes(specialty) && (
                  <Ionicons name='checkmark' size={14} color='white' />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{specialty}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderContactStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Contact Details</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.email}
          onChangeText={text => handleInputChange('email', text)}
          placeholder='business@example.com'
          keyboardType='email-address'
          autoCapitalize='none'
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number *</Text>
        <TextInput
          style={styles.textInput}
          value={formData.phone}
          onChangeText={text => handleInputChange('phone', text)}
          placeholder='(555) 123-4567'
          keyboardType='phone-pad'
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.textInput}
          value={formData.website}
          onChangeText={text => handleInputChange('website', text)}
          placeholder='https://www.yourwebsite.com'
          keyboardType='url'
          autoCapitalize='none'
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Business Address *</Text>
        <TextInput
          style={[styles.textInput, styles.textArea]}
          value={formData.address}
          onChangeText={text => handleInputChange('address', text)}
          placeholder='Enter your full business address'
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Certifications</Text>
        <View style={styles.checkboxContainer}>
          {certificationOptions.map(cert => (
            <TouchableOpacity
              key={cert}
              style={styles.checkboxItem}
              onPress={() => handleCertificationToggle(cert)}
            >
              <View
                style={[
                  styles.checkbox,
                  formData.certifications.includes(cert) && styles.checkedBox,
                ]}
              >
                {formData.certifications.includes(cert) && (
                  <Ionicons name='checkmark' size={14} color='white' />
                )}
              </View>
              <Text style={styles.checkboxLabel}>{cert}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderServicesStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Services & Pricing</Text>

      {formData.services.map((service, index) => (
        <View key={index} style={styles.serviceCard}>
          <View style={styles.serviceHeader}>
            <Text style={styles.serviceTitle}>Service {index + 1}</Text>
            <TouchableOpacity
              onPress={() => removeService(index)}
              style={styles.removeServiceButton}
            >
              <Ionicons name='close-circle' size={20} color='#F44336' />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Service Name *</Text>
            <TextInput
              style={styles.textInput}
              value={service.name}
              onChangeText={text => updateService(index, 'name', text)}
              placeholder='e.g., Private Lesson'
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={styles.textInput}
              value={service.description}
              onChangeText={text => updateService(index, 'description', text)}
              placeholder='Describe this service'
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Duration (minutes)</Text>
              <TextInput
                style={styles.textInput}
                value={service.duration.toString()}
                onChangeText={text => updateService(index, 'duration', parseInt(text) || 0)}
                placeholder='60'
                keyboardType='numeric'
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Price ($) *</Text>
              <TextInput
                style={styles.textInput}
                value={service.basePrice.toString()}
                onChangeText={text => updateService(index, 'basePrice', parseFloat(text) || 0)}
                placeholder='0.00'
                keyboardType='numeric'
              />
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addServiceButton} onPress={addService}>
        <Ionicons name='add-circle' size={20} color='#2196F3' />
        <Text style={styles.addServiceText}>Add Service</Text>
      </TouchableOpacity>
    </View>
  );

  const renderPartnershipsStep = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Partnership Settings</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>General Discount (%)</Text>
        <Text style={styles.subLabel}>Default discount for Lightning Tennis users</Text>
        <View style={styles.sliderContainer}>
          <TextInput
            style={styles.discountInput}
            value={formData.generalDiscount.toString()}
            onChangeText={text => handleInputChange('generalDiscount', parseInt(text) || 0)}
            placeholder='0'
            keyboardType='numeric'
            maxLength={2}
          />
          <Text style={styles.percentSign}>%</Text>
        </View>
      </View>

      <View style={styles.partnershipBenefits}>
        <Text style={styles.benefitsTitle}>Partnership Benefits</Text>
        <View style={styles.benefitItem}>
          <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
          <Text style={styles.benefitText}>Increased visibility to club members</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
          <Text style={styles.benefitText}>Direct booking from club partnerships</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
          <Text style={styles.benefitText}>Featured in local tennis directory</Text>
        </View>
        <View style={styles.benefitItem}>
          <Ionicons name='checkmark-circle' size={20} color='#4CAF50' />
          <Text style={styles.benefitText}>Analytics and booking insights</Text>
        </View>
      </View>

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerText}>
          ⚠️ Business registration requires admin approval. All partnerships are subject to
          Lightning Tennis terms and conditions.
        </Text>
      </View>
    </View>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderBusinessInfoStep();
      case 1:
        return renderContactStep();
      case 2:
        return renderServicesStep();
      case 3:
        return renderPartnershipsStep();
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Register Your Business</Text>
        <Text style={styles.headerSubtitle}>Join the Lightning Tennis partner network</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCurrentStep()}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.navigationButtons}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setCurrentStep(currentStep - 1)}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.nextButton, !validateCurrentStep() && styles.disabledButton]}
            onPress={handleNext}
            disabled={!validateCurrentStep() || loading}
          >
            <Text style={styles.nextButtonText}>
              {currentStep === steps.length - 1 ? 'Submit' : 'Next'}
            </Text>
            {loading && <Ionicons name='sync' size={16} color='white' style={{ marginLeft: 8 }} />}
          </TouchableOpacity>
        </View>

        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  stepContainer: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  activeStepCircle: {
    backgroundColor: '#2196F3',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeStepNumber: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  activeStepLabel: {
    color: '#2196F3',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  subLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  businessTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  businessTypeCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: '2%',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  selectedBusinessType: {
    borderColor: '#2196F3',
    backgroundColor: '#f0f8ff',
  },
  businessTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  selectedBusinessTypeLabel: {
    color: '#2196F3',
  },
  businessTypeDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
    minWidth: '45%',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  serviceCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeServiceButton: {
    padding: 4,
  },
  row: {
    flexDirection: 'row',
  },
  addServiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
    borderStyle: 'dashed',
  },
  addServiceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
    marginLeft: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
  },
  discountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    textAlign: 'center',
  },
  percentSign: {
    fontSize: 16,
    color: '#666',
    marginLeft: 8,
  },
  partnershipBenefits: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  disclaimer: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666',
  },
});

export default BusinessRegistrationForm;
