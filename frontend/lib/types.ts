export type User = {
  id: string;
  name: string;
  email: string;
  company?: string | null;
};

export type SocialLinks = {
  instagram?: string | null;
  facebook?: string | null;
  whatsapp?: string | null;
  linkedin?: string | null;
  twitter?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  pinterest?: string | null;
};

export type Company = {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  category?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  rating?: number | null;
  size?: string | null;
  revenue_estimate?: string | null;
  business_type?: 'B2B' | 'B2C' | 'Both' | null;
  social?: SocialLinks | null;
};

export type Lead = {
  id: string;
  company_id?: string | null;
  company_name: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  status: string;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadNote = {
  id: string;
  note: string;
  created_at: string;
};

export type DashboardSummary = {
  total: number;
  by_status: Array<{ status: string; count: number }>;
  recent: Array<{ id: string; company_name: string; status: string; updated_at: string }>;
};
export type SearchHistory = {
  id: string;
  query: string;
  city?: string | null;
  radius_km?: number | null;
  category?: string | null;
  created_at: string;
};
