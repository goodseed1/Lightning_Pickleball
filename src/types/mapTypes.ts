export interface MapApp {
  id: string;
  name: string;
  icon: string;
  urlScheme: string;
  fallbackUrl: string;
  isAvailable?: boolean;
}

export interface LocationData {
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  } | null;
  placeId?: string;
}

export interface MapAppSelectorProps {
  visible: boolean;
  onClose: () => void;
  location: LocationData;
  onAppSelect: (app: MapApp) => void;
}
