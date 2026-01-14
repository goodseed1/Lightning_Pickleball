// Shared types for Club Creation components

export interface LocationData {
  formatted_address?: string;
  address: string;
  coordinates?: { lat: number; lng: number };
  placeId?: string;
  // 📍 Country name for currency auto-detection (from Google Places API)
  country?: string;
  city?: string;
  state?: string;
  district?: string;
}

export interface Meeting {
  day: string;
  startTime: string;
  endTime: string;
}

export interface ClubFormData {
  name: string;
  description: string;
  logoUri?: string;
  isPublic: boolean;
  facilities: string[];
  joinFee?: number;
  monthlyFee?: number;
  yearlyFee?: number;
  rules: string;
  courtAddress?: LocationData;
  meetings: Meeting[];
}

export type FormChangeHandler<T = ClubFormData> = <K extends keyof T>(key: K, value: T[K]) => void;
