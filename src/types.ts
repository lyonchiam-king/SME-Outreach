/**
 * Outreach Studio - Data Models and API Types
 */

export type Stage =
  | 'Discovered'
  | 'Researched'
  | 'Site Briefed'
  | 'Site Built'
  | 'Email Drafted'
  | 'Sent'
  | 'Replied'
  | 'Closed'
  | 'Disqualified';

export type WebsiteStatus = 'none' | 'social_only' | 'real';

export type WhatsAppReachable = 'yes' | 'no' | 'unknown';

export type BriefApprovalStatus = 'Pending' | 'Approved' | 'Skip' | 'Later';

export type SendStatus = 'sent' | 'delivered' | 'read' | 'unconfirmed' | 'failed';

export interface Lead {
  place_id: string; // Lead ID (Google place_id)
  stage: Stage;
  business_name: string;
  category: string;
  address: string;
  phone: string;
  rating: number;
  review_count: number;
  website_status: WebsiteStatus;
  website_url?: string;
  maps_url?: string;
  campaign: string;
  country: string;
  discovered_at: string;
  last_refreshed: string;
  // Manual columns (human sets these directly)
  priority?: 'low' | 'medium' | 'high';
  owner_notes?: string;
  next_action?: string;
  whatsapp_reachable: WhatsAppReachable;
  whatsapp_checked_at?: string;
}

export interface Research {
  lead_id: string;
  business_name: string;
  tone: string;
  services: string[];
  price_tier: string;
  customer_praise: string[];
  customer_pain_points: string[];
  suggested_website_angle: string;
  social_handle?: string;
  social_bio?: string;
  social_recent_post?: string;
  social_lookup_status: 'found' | 'none' | 'pending';
  email_found?: string;
  email_source?: string;
  research_status: 'complete' | 'pending' | 'failed';
  researched_at: string;
  social_profiles: { platform: string; url: string }[];
  whatsapp_reachable: WhatsAppReachable;
  whatsapp_checked_at?: string;
}

export interface Brief {
  lead_id: string;
  business_name: string;
  lovable_prompt: string;
  approval_status: BriefApprovalStatus; // Manual column
  lovable_project_id?: string;
  preview_url?: string;
  created_at: string;
  research_summary?: {
    category: string;
    angle: string;
    praise: string;
  };
}

export interface BuildItem {
  lead_id: string;
  business_name: string;
  category: string;
  lovable_prompt: string;
  preview_url?: string;
  stage: Stage;
  country: string;
  address: string;
  created_at: string;
}

export interface SendItem {
  lead_id: string;
  business_name: string;
  category: string;
  recipient_phone: string;
  e164_phone: string;
  whatsapp_message: string;
  preview_url: string;
  screenshot_url?: string;
  stage: Stage;
  drafted_at: string;
  status?: SendStatus;
  status_detail?: string;
}

export interface OutreachLogRow {
  lead_id: string;
  business_name: string;
  channel: 'whatsapp' | 'email';
  recipient: string;
  email_source?: string;
  subject?: string;
  body_preview: string;
  gmail_draft_id?: string;
  gmail_draft_link?: string;
  whatsapp_message: string;
  drafted_at: string;
  // Manual columns
  status: SendStatus;
  sent_at?: string;
  notes?: string;
  whatsapp_sent_at?: string;
  whatsapp_status?: SendStatus;
}

export interface ErrorItem {
  id: string;
  timestamp: string;
  stage: Stage;
  lead_id: string;
  business_name: string;
  error_type: string;
  message: string;
  retryable: boolean;
}

export interface Summary {
  setup_needed?: string[];
  total: number;
  disqualified: number;
  by_stage: Record<Stage, number>;
  to_research: number;
  to_brief: number;
  to_draft: number;
  awaiting_approval: number;
  approved_unbuilt: number;
  whatsapp_waiting: number;
  errors: number;
  errors_retryable: number;
  sheet_url?: string;
}

export interface CampaignSettings {
  category: string;
  location: string;
  areas: string[];
  dailyBatchSize: number;
  perRunLimit: number;
  country: string;
  complianceAccepted: boolean;
}

export type CampaignConfig = CampaignSettings;

export interface ModelSettings {
  provider: 'gemini' | 'anthropic' | 'ollama' | 'openrouter';
  model: string;
  key_set: boolean;
  places_key_set: boolean;
}

export interface WhatsAppStatus {
  connected: boolean;
  number?: string;
  state: 'idle' | 'linking' | 'connected' | 'disconnected' | 'error';
  relayUrl: string;
}

export interface ReachabilityEntry {
  lead_id: string;
  business_name: string;
  phone: string;
  e164_phone: string;
  whatsapp_reachable: WhatsAppReachable;
  email_found?: string;
  checked_at?: string;
  buildable_reason: string;
}

export interface ReachabilityResponse {
  verified: ReachabilityEntry[];
  rejected: ReachabilityEntry[];
  waiting: ReachabilityEntry[];
  counts: {
    verified: number;
    rejected: number;
    waiting: number;
    buildable: number; // Includes no-whatsapp leads if email exists!
  };
}

export interface RunLog {
  running: string | null;
  lines: string[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  ok?: boolean;
}
