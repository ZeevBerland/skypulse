export type PlaceCategory = 'competitor' | 'demand_anchor';

export interface Place {
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: string;
  category: PlaceCategory;
  distance_m?: number;
  description?: string;
}
