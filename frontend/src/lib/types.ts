export interface User {
  email: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
  obtained_at: number; // timestamp ms
}

export interface Listing {
  listing_id: string;
  listing_url?: string;
  website?: string;
  city_id?: number;
  apartment_name?: string;
  locality?: string;
  property_type?: string;
  bedroom?: number;
  bathroom?: number;
  balcony?: number;
  floor?: number;
  total_floors?: number;
  furnishing?: string;
  facing_direction?: string;
  covered_parking?: number;
  price?: number;
  carpet_area?: number;
  super_built_up_area?: number;
  latitude?: number;
  longitude?: number;
  posted_by?: string;
  posted_by_name?: string;
  posted_by_contact?: string;
  description?: string;
  posted_at?: string;
  is_live?: boolean;
  is_verified?: boolean;
  project_id?: string;
  // Computed fields
  is_corrupt?: boolean;
  is_fake?: boolean;
  corrupt_reasons?: string[];
  fake_reasons?: string[];
}

export interface Rental {
  listing_id: string;
  listing_url?: string;
  website?: string;
  city_id?: number;
  title?: string;
  apartment_name?: string;
  locality?: string;
  property_type?: string;
  bedroom?: number;
  bathroom?: number;
  floor?: number;
  total_floors?: number;
  furnishing?: string;
  facing_direction?: string;
  price?: number; // Monthly rent
  deposit?: number;
  maintenance?: number;
  carpet_area?: number;
  super_builtup_area?: number;
  latitude?: number;
  longitude?: number;
  posted_by?: string;
  posted_by_name?: string;
  posted_by_contact?: string;
  description?: string;
  posted_at?: string;
  is_live?: boolean;
}

export interface Project {
  project_id: string;
  project_url?: string;
  city_id?: number;
  apartment_name?: string;
  developer_name?: string;
  locality?: string;
  project_status?: string;
  total_units?: number;
  total_towers?: number;
  total_floors?: number;
  launch_date?: string;
  possession_date?: string;
  rera_number?: string;
  min_area_sqft?: number;
  max_area_sqft?: number;
  price_min?: number; // Raw
  price_max?: number; // Raw
  price_min_inr?: number; // Normalized INR
  price_max_inr?: number; // Normalized INR
  total_listings?: number;
  actual_listings_count?: number;
  count_mismatch?: boolean;
  amenities?: string[];
}

export interface Locality {
  locality: string;
  listing_count: number;
}

export interface Finding {
  endpoint: string;
  category: string;
  documented: string;
  actual: string;
  how_found: string;
  impact: string;
  evidence: string[];
}

export interface BenchmarkAnswers {
  total_listing_records: number;
  unique_properties: number;
  active_listings: number;
  corrupt_listing_ids: string[];
  total_monthly_rent: number;
  avg_price_per_sqft_2bhk: number;
  costliest_project: {
    project_id: string;
    price_max_inr: number;
  };
  listings_last_7_days: number;
  fake_listing_ids: string[];
  projects_with_wrong_listing_count: number;
}

export interface ListingFilters {
  locality: string;
  bedrooms: string; // 'all' | '1' | '2' | '3' | '4+'
  minPrice: number;
  maxPrice: number;
  furnishing: string; // 'all' | 'unfurnished' | 'semi-furnished' | 'fully-furnished'
  propertyType: string; // 'all' | 'apartment' | 'independent house' | 'villa' | 'builder floor' | 'plot'
  showCorrupt: boolean;
  showFake: boolean;
  searchQuery: string;
  sortBy: string; // 'relevance' | 'price_asc' | 'price_desc' | 'area_desc' | 'date_desc'
}
