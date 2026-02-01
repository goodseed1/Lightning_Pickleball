import React, { forwardRef } from 'react';
import { Platform, FlatListProps } from 'react-native';
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteProps,
} from 'react-native-google-places-autocomplete';
import { safeSpread, safeArray, toArray } from '../../utils/safe';

// Re-export types for convenience
export type {
  GooglePlacesAutocompleteProps,
  GooglePlacesAutocompleteRef,
  Place,
  GooglePlaceData,
  GooglePlaceDetail,
} from 'react-native-google-places-autocomplete';

interface SafeGooglePlacesAutocompleteProps extends Omit<GooglePlacesAutocompleteProps, 'query'> {
  /** Optional query - defaults are applied internally for Atlanta/US bias */
  query?: GooglePlacesAutocompleteProps['query'];
  /** Optional override, but default is always 'en' per product policy */
  forceLanguage?: string;
  /** Optional override for country bias; default 'us' */
  countryBias?: string;
  /** Optional bias center; default Atlanta */
  biasLat?: number;
  biasLng?: number;
  /** Optional radius meters around bias center */
  biasRadius?: number;
  /** Optional props for the internal FlatList to handle nested scrolling */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listViewProps?: Partial<FlatListProps<any>>;
}

/**
 * Safe wrapper around GooglePlacesAutocomplete that prevents crashes from undefined props
 * Common crash: "Cannot read property 'filter' of undefined" in buildRowsFromResults
 *
 * Also enforces English language and US/Atlanta bias by default
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SafeGooglePlacesAutocomplete = forwardRef<any, SafeGooglePlacesAutocompleteProps>(
  (props, ref) => {
    const {
      forceLanguage,
      countryBias,
      biasLat,
      biasLng,
      biasRadius,
      listViewProps,
      ...restProps
    } = props;

    // ---------- Opinionated defaults per product policy ----------
    const DEFAULT_LANG = forceLanguage || 'en';
    const DEFAULT_COUNTRY = countryBias || 'us';
    // Atlanta, GA coordinates
    const ATL_LAT = biasLat ?? 33.749;
    const ATL_LNG = biasLng ?? -84.388;
    const DEFAULT_RADIUS = biasRadius ?? 80000; // ~80km

    // Get API key from environment if not provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queryKey = (restProps.query as any)?.key;
    const googleApiKey =
      queryKey ||
      (Platform.OS === 'ios'
        ? process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_IOS
        : process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY_ANDROID);

    // ---------- Build a safe, merged query ----------
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeQuery: any = {
      // Caller query first so we can override below
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...safeSpread(restProps.query as any),
      key: googleApiKey,
      // FORCE English results regardless of UI language
      language: DEFAULT_LANG,
      // Country/region bias
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      components: (restProps.query as any)?.components ?? `country:${DEFAULT_COUNTRY}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      region: (restProps.query as any)?.region ?? DEFAULT_COUNTRY,
      // Location bias near Atlanta unless caller provided
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      location: (restProps.query as any)?.location ?? `${ATL_LAT},${ATL_LNG}`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      radius: (restProps.query as any)?.radius ?? DEFAULT_RADIUS,
    };

    // Ensure types is an array only when provided
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((restProps.query as any)?.types) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      safeQuery.types = toArray((restProps.query as any).types);
    }

    // Apply same language to details query for formatted_address, etc.
    const safeDetailsQuery = {
      ...safeSpread(restProps.GooglePlacesDetailsQuery),
      language: DEFAULT_LANG,
    };

    // Safe defaults to prevent .filter() crashes
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeProps: any = {
      ...restProps,

      // Ensure predefinedPlaces is always an array
      predefinedPlaces: safeArray(restProps.predefinedPlaces, []),

      // Ensure filterReverseGeocodingByTypes is always an array if provided
      filterReverseGeocodingByTypes: restProps.filterReverseGeocodingByTypes
        ? safeArray(restProps.filterReverseGeocodingByTypes, [])
        : undefined,

      // Ensure Google Places search query has safe defaults
      GooglePlacesSearchQuery: {
        rankby: 'distance',
        ...safeSpread(restProps.GooglePlacesSearchQuery),
      },

      // Safe styles object
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      styles: safeSpread(restProps.styles as any),

      // Use our enhanced query with bias
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      query: safeQuery as any,

      // Apply language to details query as well
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      GooglePlacesDetailsQuery: safeDetailsQuery as any,

      // Safe textInputProps
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      textInputProps: safeSpread(restProps.textInputProps as any),

      // Safe renderLeftButton and renderRightButton to prevent composition issues
      renderLeftButton: restProps.renderLeftButton || undefined,
      renderRightButton: restProps.renderRightButton || undefined,

      // Pass through listViewProps for nested scrolling control
      listViewProps: listViewProps || {},

      // CRITICAL: Ensure onPress callback is passed through properly with debugging
      onPress: restProps.onPress
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (data: any, details: any) => {
            if (restProps.onPress) {
              return restProps.onPress(data, details);
            }
          }
        : undefined,
    };

    return <GooglePlacesAutocomplete ref={ref} {...safeProps} />;
  }
);

SafeGooglePlacesAutocomplete.displayName = 'SafeGooglePlacesAutocomplete';

export default SafeGooglePlacesAutocomplete;
