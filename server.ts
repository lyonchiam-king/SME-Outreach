import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  Lead,
  Research,
  Brief,
  CampaignSettings,
  ErrorItem,
  SendStatus,
} from './src/types';

const app = express();
const PORT = 3000;

app.use(express.json());

// In-Memory Storage & Mock Database State
let sheetCreated = false;
let sheetUrl = '';
let sheetTitle = '';

let modelSettings = {
  provider: 'gemini' as const,
  model: 'gemini-3.8-flash',
  key_set: false,
  places_key_set: false,
  model_key_secret: '',
  places_key_secret: '',
};

let campaignSettings: CampaignSettings = {
  category: 'Plumbing & HVAC Services',
  location: 'New Orleans, LA, USA',
  areas: [
    'French Quarter',
    'Garden District',
    'Mid-City',
    'Uptown',
    'Marigny',
    'Bywater',
    'Algiers Point',
    'Metairie',
  ],
  dailyBatchSize: 25,
  perRunLimit: 10,
  country: 'United States (+1)',
  complianceAccepted: true,
};

let designLevelSettings = {
  level: 'modern' as 'classic' | 'modern' | 'luxury' | 'bold',
  customization: 'high' as 'standard' | 'high' | 'full',
  tone: 'conversion_focused',
};

let servicesSettings = {
  enabled_services: ['website_generation', 'seo_briefs', 'whatsapp_outreach'],
  pricing_tier: 'pro',
  auto_build: true,
};

let whatsappStatus = {
  connected: false,
  number: '',
  state: 'disconnected' as 'idle' | 'linking' | 'connected' | 'disconnected' | 'error',
  relayUrl: 'http://127.0.0.1:8787',
};

let runnerState = {
  running: null as string | null,
  lines: [
    `[${new Date().toLocaleTimeString()}] System initialized. Waiting for user actions.`,
  ],
};

// Seed 50 realistic SME leads
const initialLeads: Lead[] = [
  // Discovered (12)
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12001',
    stage: 'Discovered',
    business_name: 'Magnolia Pipe & Drain Repair',
    category: 'Plumbing Services',
    address: '1420 Canal St, New Orleans, LA 70112',
    phone: '(504) 555-0112',
    rating: 4.8,
    review_count: 42,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T08:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12002',
    stage: 'Discovered',
    business_name: 'Crescent City Auto & Tire',
    category: 'Auto Repair',
    address: '3201 Tulane Ave, New Orleans, LA 70119',
    phone: '(504) 555-0145',
    rating: 4.6,
    review_count: 88,
    website_status: 'social_only',
    website_url: 'https://facebook.com/crescentcityauto',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T09:15:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'unknown',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12003',
    stage: 'Discovered',
    business_name: 'Bywater Bakery & Cafe',
    category: 'Bakery',
    address: '3624 Dauphine St, New Orleans, LA 70117',
    phone: '(504) 555-0199',
    rating: 4.9,
    review_count: 124,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T09:40:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12004',
    stage: 'Discovered',
    business_name: 'Delta Spark Electricians',
    category: 'Electrical Services',
    address: '812 Prytania St, New Orleans, LA 70130',
    phone: '(504) 555-0210',
    rating: 4.7,
    review_count: 31,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T10:10:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'unknown',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12005',
    stage: 'Discovered',
    business_name: 'Bourbon Street Barber & Shave',
    category: 'Barber Shop',
    address: '510 Bourbon St, New Orleans, LA 70130',
    phone: '(504) 555-0234',
    rating: 4.9,
    review_count: 210,
    website_status: 'social_only',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T10:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12006',
    stage: 'Discovered',
    business_name: 'Pontchartrain Heating & Air',
    category: 'HVAC Services',
    address: '4501 Veterans Memorial Blvd, Metairie, LA 70006',
    phone: '(504) 555-0288',
    rating: 4.5,
    review_count: 56,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T11:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12007',
    stage: 'Discovered',
    business_name: 'Garden District Pet Grooming',
    category: 'Pet Care',
    address: '2718 Magazine St, New Orleans, LA 70130',
    phone: '(504) 555-0301',
    rating: 4.8,
    review_count: 79,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T11:20:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12008',
    stage: 'Discovered',
    business_name: 'NOLA Master Locksmiths',
    category: 'Locksmith',
    address: '1100 Poydras St, New Orleans, LA 70112',
    phone: '(504) 555-0344',
    rating: 4.9,
    review_count: 140,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T11:45:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12009',
    stage: 'Discovered',
    business_name: 'Bayou Pest Control Experts',
    category: 'Pest Control',
    address: '1900 Carrollton Ave, New Orleans, LA 70118',
    phone: '(504) 555-0390',
    rating: 4.4,
    review_count: 28,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T12:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'unknown',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12010',
    stage: 'Discovered',
    business_name: 'Mid-City Dental Care Studio',
    category: 'Dental Clinic',
    address: '4100 Canal St, New Orleans, LA 70119',
    phone: '(504) 555-0422',
    rating: 4.9,
    review_count: 165,
    website_status: 'social_only',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T12:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12011',
    stage: 'Discovered',
    business_name: 'French Quarter Floral Design',
    category: 'Florist',
    address: '712 Royal St, New Orleans, LA 70116',
    phone: '(504) 555-0455',
    rating: 4.7,
    review_count: 62,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T13:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12012',
    stage: 'Discovered',
    business_name: 'Uptown Tailors & Alterations',
    category: 'Tailor',
    address: '5400 Magazine St, New Orleans, LA 70115',
    phone: '(504) 555-0480',
    rating: 4.8,
    review_count: 45,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-09-01T13:15:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
  },

  // Researched (8)
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12013',
    stage: 'Researched',
    business_name: 'Cajun Roofing & Gutters',
    category: 'Roofing Contractor',
    address: '2200 St Charles Ave, New Orleans, LA 70130',
    phone: '(504) 555-0512',
    rating: 4.9,
    review_count: 94,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-30T09:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12014',
    stage: 'Researched',
    business_name: 'Marigny Music School',
    category: 'Music Academy',
    address: '2400 St Claude Ave, New Orleans, LA 70117',
    phone: '(504) 555-0540',
    rating: 5.0,
    review_count: 38,
    website_status: 'social_only',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-30T09:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12015',
    stage: 'Researched',
    business_name: 'Lafayette Square Coffee Roasters',
    category: 'Coffee Shop',
    address: '600 Camp St, New Orleans, LA 70130',
    phone: '(504) 555-0577',
    rating: 4.8,
    review_count: 180,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-30T10:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12016',
    stage: 'Researched',
    business_name: 'Big Easy Custom Woodworking',
    category: 'Carpentry',
    address: '1500 Tchoupitoulas St, New Orleans, LA 70130',
    phone: '(504) 555-0601',
    rating: 4.9,
    review_count: 52,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-30T10:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12017',
    stage: 'Researched',
    business_name: 'Algiers Point Kayak & Bike Rentals',
    category: 'Outdoor Recreation',
    address: '200 Morgan St, New Orleans, LA 70114',
    phone: '(504) 555-0633',
    rating: 4.7,
    review_count: 73,
    website_status: 'social_only',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-30T11:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12018',
    stage: 'Researched',
    business_name: 'Oak Alley Auto Glass Repair',
    category: 'Auto Glass',
    address: '3800 Airline Dr, Metairie, LA 70001',
    phone: '(504) 555-0688',
    rating: 4.6,
    review_count: 41,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-30T11:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12019',
    stage: 'Researched',
    business_name: 'Metairie Chiropractic Center',
    category: 'Chiropractor',
    address: '3000 Kingman St, Metairie, LA 70006',
    phone: '(504) 555-0710',
    rating: 4.9,
    review_count: 115,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-30T12:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12020',
    stage: 'Researched',
    business_name: 'Bourbon Street Tattoo Parlor',
    category: 'Tattoo Studio',
    address: '820 Bourbon St, New Orleans, LA 70116',
    phone: '(504) 555-0744',
    rating: 4.8,
    review_count: 230,
    website_status: 'social_only',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-30T12:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },

  // Site Briefed / Pending Review (6)
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12021',
    stage: 'Site Briefed',
    business_name: 'Pelican State Appliance Repair',
    category: 'Appliance Repair',
    address: '1200 N Broad St, New Orleans, LA 70119',
    phone: '(504) 555-0780',
    rating: 4.8,
    review_count: 67,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-28T08:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12022',
    stage: 'Site Briefed',
    business_name: 'Royal Street Antiques & Art',
    category: 'Antique Store',
    address: '412 Royal St, New Orleans, LA 70130',
    phone: '(504) 555-0811',
    rating: 4.9,
    review_count: 145,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-28T08:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12023',
    stage: 'Site Briefed',
    business_name: 'Southern Charm Landscaping',
    category: 'Landscaper',
    address: '1801 Claiborne Ave, New Orleans, LA 70125',
    phone: '(504) 555-0845',
    rating: 4.7,
    review_count: 39,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-28T09:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12024',
    stage: 'Site Briefed',
    business_name: 'St Claude Pilates & Wellness',
    category: 'Fitness Studio',
    address: '3100 St Claude Ave, New Orleans, LA 70117',
    phone: '(504) 555-0890',
    rating: 5.0,
    review_count: 82,
    website_status: 'social_only',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-28T09:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12025',
    stage: 'Site Briefed',
    business_name: 'Vieux Carré House Wash & Pressure',
    category: 'Pressure Washing',
    address: '900 Chartres St, New Orleans, LA 70116',
    phone: '(504) 555-0920',
    rating: 4.8,
    review_count: 53,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-28T10:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12026',
    stage: 'Site Briefed',
    business_name: 'Delta City Towing Services',
    category: 'Towing Service',
    address: '2500 Chef Menteur Hwy, New Orleans, LA 70126',
    phone: '(504) 555-0966',
    rating: 4.4,
    review_count: 110,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-28T10:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
  },

  // Site Built / Approved & Built (8)
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12027',
    stage: 'Site Built',
    business_name: 'Antoine Plumbing & Gas Services',
    category: 'Plumbing Services',
    address: '2100 St Bernard Ave, New Orleans, LA 70119',
    phone: '(504) 555-0988',
    rating: 4.9,
    review_count: 88,
    website_status: 'none',
    website_url: 'https://antoine-plumbing.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-25T08:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12028',
    stage: 'Site Built',
    business_name: 'NOLA Green Thumb Tree Surgeons',
    category: 'Tree Service',
    address: '3500 Washington Ave, New Orleans, LA 70125',
    phone: '(504) 555-1020',
    rating: 4.8,
    review_count: 64,
    website_status: 'none',
    website_url: 'https://nola-greenthumb.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-25T08:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12029',
    stage: 'Site Built',
    business_name: 'Frenchmen St Pizza Parlor',
    category: 'Pizzeria',
    address: '618 Frenchmen St, New Orleans, LA 70116',
    phone: '(504) 555-1055',
    rating: 4.7,
    review_count: 310,
    website_status: 'social_only',
    website_url: 'https://frenchmen-pizza.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-25T09:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12030',
    stage: 'Site Built',
    business_name: 'Crescent City Lock & Safe',
    category: 'Locksmith',
    address: '1501 Tulane Ave, New Orleans, LA 70112',
    phone: '(504) 555-1090',
    rating: 4.9,
    review_count: 98,
    website_status: 'none',
    website_url: 'https://crescent-lock.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-25T09:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12031',
    stage: 'Site Built',
    business_name: 'Uptown Vet Hospital & Care',
    category: 'Veterinarian',
    address: '4300 Magazine St, New Orleans, LA 70115',
    phone: '(504) 555-1122',
    rating: 4.9,
    review_count: 188,
    website_status: 'none',
    website_url: 'https://uptown-vet.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-25T10:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12032',
    stage: 'Site Built',
    business_name: 'Bayou Custom Cabinetry',
    category: 'Cabinetmaker',
    address: '2900 N Galvez St, New Orleans, LA 70117',
    phone: '(504) 555-1150',
    rating: 4.8,
    review_count: 42,
    website_status: 'none',
    website_url: 'https://bayou-cabinets.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-25T10:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12033',
    stage: 'Site Built',
    business_name: 'Magazine St Body Art & Piercing',
    category: 'Body Piercing',
    address: '3200 Magazine St, New Orleans, LA 70115',
    phone: '(504) 555-1188',
    rating: 4.6,
    review_count: 140,
    website_status: 'social_only',
    website_url: 'https://mag-bodyart.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-25T11:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12034',
    stage: 'Site Built',
    business_name: 'Metairie Auto Detail Pros',
    category: 'Car Detailing',
    address: '4200 Veterans Memorial Blvd, Metairie, LA 70006',
    phone: '(504) 555-1210',
    rating: 4.9,
    review_count: 112,
    website_status: 'none',
    website_url: 'https://metairie-autodetail.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-25T11:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },

  // Email Drafted (4)
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12035',
    stage: 'Email Drafted',
    business_name: 'Algiers Heating & Air Conditioning',
    category: 'HVAC Services',
    address: '500 Pelican Ave, New Orleans, LA 70114',
    phone: '(504) 555-1244',
    rating: 4.5,
    review_count: 36,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-22T08:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12036',
    stage: 'Email Drafted',
    business_name: 'Mid-City Glass & Window Doctors',
    category: 'Window Repair',
    address: '3800 Broad St, New Orleans, LA 70125',
    phone: '(504) 555-1280',
    rating: 4.7,
    review_count: 51,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-22T08:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12037',
    stage: 'Email Drafted',
    business_name: 'Decatur St Antique Clock Repair',
    category: 'Clock Repair',
    address: '1012 Decatur St, New Orleans, LA 70116',
    phone: '(504) 555-1310',
    rating: 4.9,
    review_count: 22,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-22T09:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12038',
    stage: 'Email Drafted',
    business_name: 'Tulane Ave Motor Mechanics',
    category: 'Auto Repair',
    address: '2800 Tulane Ave, New Orleans, LA 70119',
    phone: '(504) 555-1345',
    rating: 4.6,
    review_count: 63,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-22T09:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
  },

  // Sent (7)
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12039',
    stage: 'Sent',
    business_name: 'Prytania St Dental Arts',
    category: 'Dentist',
    address: '1400 Prytania St, New Orleans, LA 70130',
    phone: '(504) 555-1390',
    rating: 4.9,
    review_count: 142,
    website_status: 'none',
    website_url: 'https://prytania-dental.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-20T08:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12040',
    stage: 'Sent',
    business_name: 'Canal St Shoe & Boot Repair',
    category: 'Shoe Repair',
    address: '1220 Canal St, New Orleans, LA 70112',
    phone: '(504) 555-1420',
    rating: 4.8,
    review_count: 85,
    website_status: 'none',
    website_url: 'https://canal-shoerepair.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-20T08:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12041',
    stage: 'Sent',
    business_name: 'Bywater Bicycle Collective',
    category: 'Bicycle Shop',
    address: '2900 Royal St, New Orleans, LA 70117',
    phone: '(504) 555-1455',
    rating: 4.9,
    review_count: 110,
    website_status: 'social_only',
    website_url: 'https://bywater-bikes.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-20T09:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12042',
    stage: 'Sent',
    business_name: 'Garden District Plumbing & Gas',
    category: 'Plumbing Services',
    address: '1900 Washington Ave, New Orleans, LA 70113',
    phone: '(504) 555-1488',
    rating: 4.9,
    review_count: 175,
    website_status: 'none',
    website_url: 'https://gardendistrict-plumbing.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-20T09:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12043',
    stage: 'Sent',
    business_name: 'Metro Electric & Power Solutions',
    category: 'Electrician',
    address: '4000 Tulane Ave, New Orleans, LA 70119',
    phone: '(504) 555-1510',
    rating: 4.7,
    review_count: 64,
    website_status: 'none',
    website_url: 'https://metro-electric-nola.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-20T10:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12044',
    stage: 'Sent',
    business_name: 'NOLA Creole Catering Service',
    category: 'Caterer',
    address: '1600 Rampart St, New Orleans, LA 70116',
    phone: '(504) 555-1540',
    rating: 4.9,
    review_count: 205,
    website_status: 'social_only',
    website_url: 'https://nolacreole-catering.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-20T10:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12045',
    stage: 'Sent',
    business_name: 'Pontchartrain Pet Resort',
    category: 'Pet Boarding',
    address: '3200 Causeway Blvd, Metairie, LA 70002',
    phone: '(504) 555-1580',
    rating: 4.8,
    review_count: 130,
    website_status: 'none',
    website_url: 'https://pontchartrain-pets.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-20T11:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
  },

  // Replied (3)
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12046',
    stage: 'Replied',
    business_name: 'St Charles Avenue Salon & Spa',
    category: 'Hair Salon',
    address: '3800 St Charles Ave, New Orleans, LA 70115',
    phone: '(504) 555-1612',
    rating: 4.9,
    review_count: 320,
    website_status: 'none',
    website_url: 'https://stcharles-salon.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-15T08:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    owner_notes: 'Owner texted back! Wants to add booking integration link.',
    next_action: 'Send custom quote for custom domain connection.',
    priority: 'high',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12047',
    stage: 'Replied',
    business_name: 'French Quarter Coffee & Beignets',
    category: 'Cafe',
    address: '800 Chartres St, New Orleans, LA 70116',
    phone: '(504) 555-1650',
    rating: 4.9,
    review_count: 480,
    website_status: 'none',
    website_url: 'https://fq-beignets.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-15T08:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    owner_notes: 'Manager loved the mobile menu preview. Call on Thursday.',
    next_action: 'Schedule demo call on Thursday 2pm.',
    priority: 'high',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12048',
    stage: 'Replied',
    business_name: 'Bayou City HVAC Emergency Repair',
    category: 'HVAC Services',
    address: '1100 Carrollton Ave, New Orleans, LA 70118',
    phone: '(504) 555-1690',
    rating: 4.8,
    review_count: 140,
    website_status: 'none',
    website_url: 'https://bayou-hvac-nola.lovable.app',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-15T09:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'yes',
    owner_notes: 'Asked if we can include emergency phone button at top.',
    next_action: 'Update site prompt with prominent call CTA.',
    priority: 'medium',
  },

  // Disqualified (2)
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12049',
    stage: 'Disqualified',
    business_name: 'Closed Down Cajun Cafe',
    category: 'Restaurant',
    address: '120 Bourbon St, New Orleans, LA 70130',
    phone: '(504) 555-9999',
    rating: 2.1,
    review_count: 12,
    website_status: 'none',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-10T08:00:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
    owner_notes: 'Permanently closed down location.',
  },
  {
    place_id: 'ChIJN1t_t_a1EIYRh_12050',
    stage: 'Disqualified',
    business_name: 'National Corporate HVAC Franchise',
    category: 'HVAC Services',
    address: '1000 Poydras St, New Orleans, LA 70112',
    phone: '(504) 555-8888',
    rating: 4.2,
    review_count: 520,
    website_status: 'real',
    website_url: 'https://nationalhvacfranchise.com',
    campaign: 'Plumbing & HVAC Services',
    country: 'United States',
    discovered_at: '2026-08-10T08:30:00Z',
    last_refreshed: '2026-09-02T10:00:00Z',
    whatsapp_reachable: 'no',
    owner_notes: 'Has custom corporate site already.',
  },
];

let leadsStore: Lead[] = [...initialLeads];

// Research Store map
let researchStore: Record<string, Research> = {
  // Researched items
  ChIJN1t_t_a1EIYRh_12013: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12013',
    business_name: 'Cajun Roofing & Gutters',
    tone: 'Rugged, dependable, emergency-ready',
    services: ['Roof Leak Repair', 'Slate & Tile Restoration', 'Gutter Installation', 'Storm Damage Inspection'],
    price_tier: 'Mid-range ($$$)',
    customer_praise: ['Showed up in 30 mins during heavy storm', 'Cleaned up all nails and debris', 'Fair pricing with no hidden fees'],
    customer_pain_points: ['No online booking or quote form', 'Phone line busy during rainstorms'],
    suggested_website_angle: 'Emergency 24/7 Roof Leak Response & Instant Quote Estimator',
    social_lookup_status: 'found',
    social_handle: '@cajunroofingnola',
    social_bio: 'New Orleans premier roofing & storm response team. Serving the Greater NOLA area since 2011.',
    social_recent_post: 'Hurricane season checkup: call us today before the storms hit!',
    email_found: 'contact@cajunroofingnola.com',
    email_source: 'Facebook About Page',
    research_status: 'complete',
    researched_at: '2026-08-30T09:10:00Z',
    social_profiles: [{ platform: 'Facebook', url: 'https://facebook.com/cajunroofingnola' }],
    whatsapp_reachable: 'yes',
    whatsapp_checked_at: '2026-09-02T11:00:00Z',
  },
  ChIJN1t_t_a1EIYRh_12021: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12021',
    business_name: 'Pelican State Appliance Repair',
    tone: 'Prompt, expert, family-owned',
    services: ['Refrigerator Repair', 'Washer/Dryer Fix', 'Oven & Stove Tech', 'Same-Day Diagnostics'],
    price_tier: 'Affordable ($$)',
    customer_praise: ['Fixed our Sub-Zero fridge same day', 'Honest tech told us it was just a loose fuse'],
    customer_pain_points: ['Hard to find list of supported brands online', 'Only accepts cash or phone call'],
    suggested_website_angle: 'Same-Day Appliance Repair & Instant Brand Diagnostic Selector',
    social_lookup_status: 'found',
    social_handle: '@pelicanappliancerepair',
    email_found: 'service@pelicanappliance.com',
    email_source: 'Google Places Listing',
    research_status: 'complete',
    researched_at: '2026-08-28T08:15:00Z',
    social_profiles: [{ platform: 'Facebook', url: 'https://facebook.com/pelicanappliancerepair' }],
    whatsapp_reachable: 'yes',
  },
  ChIJN1t_t_a1EIYRh_12022: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12022',
    business_name: 'Royal Street Antiques & Art',
    tone: 'Elegant, historic, curated luxury',
    services: ['19th-Century Estate Furniture', 'Local Creole Artwork', 'Appraisals & Consignment', 'Worldwide Shipping'],
    price_tier: 'Luxury ($$$$)',
    customer_praise: ['Unbelievable collection of 1800s French Quarter artifacts', 'Owner spent an hour explaining history'],
    customer_pain_points: ['No online photo gallery to browse items', 'Out-of-town tourists cannot order remotely'],
    suggested_website_angle: 'Interactive French Quarter Antique Gallery & Private Inquiries Portal',
    social_lookup_status: 'found',
    social_handle: '@royalstreetantiques',
    email_found: 'art@royalstreetantiques.com',
    research_status: 'complete',
    researched_at: '2026-08-28T08:45:00Z',
    social_profiles: [{ platform: 'Instagram', url: 'https://instagram.com/royalstreetantiques' }],
    whatsapp_reachable: 'yes',
  },
  ChIJN1t_t_a1EIYRh_12023: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12023',
    business_name: 'Southern Charm Landscaping',
    tone: 'Vibrant, lush, Southern estate style',
    services: ['Courtyard Design', 'Palm & Fern Planting', 'Irrigation Systems', 'Weekly Maintenance'],
    price_tier: 'Mid-range ($$$)',
    customer_praise: ['Transformed our small Garden District courtyard into an oasis', 'Always reliable'],
    customer_pain_points: ['No portfolio pictures available anywhere', 'Potential clients cannot request estimates'],
    suggested_website_angle: 'NOLA Courtyard Before/After Showcase & Instant Quote Request',
    social_lookup_status: 'none',
    email_found: 'info@southerncharmlandscaping.com',
    research_status: 'complete',
    researched_at: '2026-08-28T09:15:00Z',
    social_profiles: [],
    whatsapp_reachable: 'yes',
  },
  ChIJN1t_t_a1EIYRh_12024: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12024',
    business_name: 'St Claude Pilates & Wellness',
    tone: 'Calm, welcoming, community-focused',
    services: ['Reformer Pilates', 'Mat Classes', 'Private Instruction', 'Posture Realignment'],
    price_tier: 'Mid-range ($$$)',
    customer_praise: ['Instructors are incredibly attentive', 'Small class sizes make a huge difference'],
    customer_pain_points: ['Weekly schedule only posted on Instagram stories', 'No online booking button'],
    suggested_website_angle: 'Mindful Pilates & Online Class Reservation Portal',
    social_lookup_status: 'found',
    social_handle: '@stclaudepilates',
    email_found: 'hello@stclaudepilates.com',
    research_status: 'complete',
    researched_at: '2026-08-28T09:45:00Z',
    social_profiles: [{ platform: 'Instagram', url: 'https://instagram.com/stclaudepilates' }],
    whatsapp_reachable: 'yes',
  },
  ChIJN1t_t_a1EIYRh_12025: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12025',
    business_name: 'Vieux Carré House Wash & Pressure',
    tone: 'High precision, eco-friendly, historic brick safe',
    services: ['Soft Wash House Washing', 'Historic Brick & Slate Cleaning', 'Driveway Sealing', 'Gutter Flush'],
    price_tier: 'Affordable ($$)',
    customer_praise: ['Removed 10 years of grime without damaging 150-year-old plaster', 'Punctual and courteous'],
    customer_pain_points: ['Customers want square-footage price estimates online', 'No place to see video transformations'],
    suggested_website_angle: 'Historic House Soft-Wash Specialist & Square-Foot Estimator',
    social_lookup_status: 'found',
    social_handle: '@vieuxcarrewash',
    email_found: 'estimates@vieuxcarrewash.com',
    research_status: 'complete',
    researched_at: '2026-08-28T10:15:00Z',
    social_profiles: [{ platform: 'Facebook', url: 'https://facebook.com/vieuxcarrewash' }],
    whatsapp_reachable: 'yes',
  },
};

// Briefs store
let briefsStore: Record<string, Brief> = {
  ChIJN1t_t_a1EIYRh_12021: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12021',
    business_name: 'Pelican State Appliance Repair',
    approval_status: 'Pending',
    created_at: '2026-08-28T08:30:00Z',
    research_summary: {
      category: 'Appliance Repair',
      angle: 'Same-Day Repair & Instant Brand Selector',
      praise: 'Fixed Sub-Zero fridge same day',
    },
    lovable_prompt: `Build a high-converting, modern, mobile-first website for "Pelican State Appliance Repair" in New Orleans.
Hero Section: High impact title "Same-Day Appliance Repair in Greater New Orleans" with emergency phone CTA (504-555-0780) and 4.8-star review badge.
Interactive Appliance Selector: Customers choose fridge, washer, dryer, oven, or dishwasher for an instant diagnostic cost estimate.
Supported Brands Carousel: Whirlpool, Sub-Zero, GE, Samsung, LG, Maytag, Bosch.
Customer Testimonials Section: Highlight 5-star Google review praise ("Fixed our Sub-Zero fridge same day!").
Booking / Quote Form: Quick 3-step appointment booking form with preferred time slots.
Style: Professional navy blue & energetic amber yellow accents, crisp typography, responsive mobile sticky call button.`,
  },
  ChIJN1t_t_a1EIYRh_12022: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12022',
    business_name: 'Royal Street Antiques & Art',
    approval_status: 'Pending',
    created_at: '2026-08-28T09:00:00Z',
    research_summary: {
      category: 'Antique Store',
      angle: 'Interactive French Quarter Antique Gallery & Inquiries',
      praise: '1800s French Quarter artifacts',
    },
    lovable_prompt: `Build a luxury, high-end gallery website for "Royal Street Antiques & Art", located in the heart of the French Quarter, New Orleans.
Hero Section: Elegant serif typography over a warm candle-lit antique gallery backdrop. Headline: "Curated 19th-Century Antiques & Fine Creole Art".
Interactive Collection Showcase: Filterable grid for French Furniture, Creole Oil Paintings, Estate Silver, and Rare Collectibles.
Private Inquiry Modal: Collectors can request high-resolution photos, provenance details, and worldwide white-glove shipping quotes.
Store Location & Visiting Hours: Interactive French Quarter map, walking directions from Jackson Square.
Style: Warm charcoal & antiqued gold palette, Playfair Display headers, spacious gallery grid layout, refined luxury hover effects.`,
  },
  ChIJN1t_t_a1EIYRh_12023: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12023',
    business_name: 'Southern Charm Landscaping',
    approval_status: 'Pending',
    created_at: '2026-08-28T09:30:00Z',
    research_summary: {
      category: 'Landscaper',
      angle: 'NOLA Courtyard Before/After Showcase & Quote Request',
      praise: 'Transformed Garden District courtyard',
    },
    lovable_prompt: `Build a fresh, vibrant landscape architecture website for "Southern Charm Landscaping" in New Orleans.
Hero Section: Full-bleed image of a restored Garden District brick courtyard with lush tropical palms and fountain. Headline: "Crafting Historic New Orleans Courtyards & Estates".
Before / After Slider: Interactive comparison of overgrown yards vs. restored courtyard retreats.
Services Grid: Courtyard Restorations, Exotic Palm Planting, Custom Irrigation, Weekly Estate Care.
Instant Quote Estimator: Select yard type (Courtyard, Front Lawn, Full Estate) and services needed.
Style: Deep botanical green, warm terracotta stone accents, clean sans-serif typography, smooth scroll animations.`,
  },
  ChIJN1t_t_a1EIYRh_12024: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12024',
    business_name: 'St Claude Pilates & Wellness',
    approval_status: 'Pending',
    created_at: '2026-08-28T10:00:00Z',
    research_summary: {
      category: 'Fitness Studio',
      angle: 'Mindful Pilates & Online Class Reservation Portal',
      praise: 'Attentive instructors & small class sizes',
    },
    lovable_prompt: `Build a zen, modern, boutique wellness website for "St Claude Pilates & Wellness" in the Bywater / Marigny area of New Orleans.
Hero Section: Clean minimalist studio aesthetic with warm daylight. Headline: "Strengthen, Align, Restore — Boutique Pilates on St Claude".
Live Weekly Schedule Filter: Interactive calendar allowing users to filter by Reformer, Mat, or Beginner Level and click "Reserve Spot".
New Client Intro Offer Banner: "$49 First Week Unlimited Classes" sticky banner CTA.
Instructor Profiles: Bios and photos highlighting personalized alignment coaching.
Style: Soft sage green, warm cream (#FBF9F5) background, subtle serif titles, rounded pill buttons, high-contrast accessible layout.`,
  },
  ChIJN1t_t_a1EIYRh_12025: {
    lead_id: 'ChIJN1t_t_a1EIYRh_12025',
    business_name: 'Vieux Carré House Wash & Pressure',
    approval_status: 'Pending',
    created_at: '2026-08-28T10:30:00Z',
    research_summary: {
      category: 'Pressure Washing',
      angle: 'Historic House Soft-Wash Specialist & Instant Estimator',
      praise: 'Removed 10 years grime without damaging historic plaster',
    },
    lovable_prompt: `Build a high-conversion, trustworthy pressure washing website for "Vieux Carré House Wash & Pressure" in New Orleans.
Hero Section: Split design showing clean historic French Quarter facade with headline "Gentle Soft-Wash Protection for Historic NOLA Homes".
Instant Price Estimator Widget: Users input square footage and surface type (Brick, Stucco, Wood Siding, Driveway) for instant range estimate.
Safety Guarantee Section: Explaining low-pressure chemical soft-washing vs harsh high-pressure blasting.
Video Showcase & Reviews: 5-star Google review callouts and before/after surface cleans.
Style: Fresh cyan blue, slate gray, clean white card containers, clear action buttons, sticky mobile contact bar.`,
  },
};

// Draft messages for built sites
let sendQueueStore: Record<string, { whatsapp_message: string; preview_url: string }> = {
  ChIJN1t_t_a1EIYRh_12027: {
    whatsapp_message: `Hi team at Antoine Plumbing & Gas! 👋 I noticed your 4.9-star rating in New Orleans, but couldn't find an official website when searching online.

I put together a quick 1-minute demo site tailored specifically for Antoine Plumbing — including your emergency leak repair services and a direct quote request form:

👉 https://antoine-plumbing.lovable.app

No pressure at all! Let me know if you'd like to customize anything or make it your official domain.`,
    preview_url: 'https://antoine-plumbing.lovable.app',
  },
  ChIJN1t_t_a1EIYRh_12028: {
    whatsapp_message: `Hey NOLA Green Thumb team! 🌳 Your 64+ 5-star Google reviews look fantastic. We built a custom mobile showcase for your tree surgery and arbor services:

👉 https://nola-greenthumb.lovable.app

It includes an instant storm cleanup estimator for customers. Take a look and let me know what you think!`,
    preview_url: 'https://nola-greenthumb.lovable.app',
  },
  ChIJN1t_t_a1EIYRh_12029: {
    whatsapp_message: `Hi Frenchmen St Pizza! 🍕 Love your pizza spot. I noticed your menu was only on Instagram stories, so we created a slick digital menu & order page for you:

👉 https://frenchmen-pizza.lovable.app

Check it out!`,
    preview_url: 'https://frenchmen-pizza.lovable.app',
  },
  ChIJN1t_t_a1EIYRh_12030: {
    whatsapp_message: `Hi Crescent City Lock & Safe! 🔑 We put together a fast emergency lockout web page for your locksmith services in NOLA:

👉 https://crescent-lock.lovable.app

Includes a tap-to-call button and service area coverage map. Hope it helps!`,
    preview_url: 'https://crescent-lock.lovable.app',
  },
  ChIJN1t_t_a1EIYRh_12031: {
    whatsapp_message: `Hi Uptown Vet Hospital! 🐾 Your 188 reviews on Magazine St are amazing. We designed a clean online appointment request site for your hospital:

👉 https://uptown-vet.lovable.app

Have a peek when you get a moment!`,
    preview_url: 'https://uptown-vet.lovable.app',
  },
  ChIJN1t_t_a1EIYRh_12032: {
    whatsapp_message: `Hi Bayou Custom Cabinetry! 🪵 We saw your incredible woodworking work and built a 1-minute portfolio demo for your kitchen & bathroom cabinet designs:

👉 https://bayou-cabinets.lovable.app

Let us know if you'd like to use it!`,
    preview_url: 'https://bayou-cabinets.lovable.app',
  },
  ChIJN1t_t_a1EIYRh_12033: {
    whatsapp_message: `Hey Magazine St Body Art! 🎨 We created a stylish gallery landing page for your piercing & tattoo studio:

👉 https://mag-bodyart.lovable.app

Check it out on your phone!`,
    preview_url: 'https://mag-bodyart.lovable.app',
  },
  ChIJN1t_t_a1EIYRh_12034: {
    whatsapp_message: `Hi Metairie Auto Detail Pros! 🚗 We created a quick booking & package comparison landing page for your auto detailing shop:

👉 https://metairie-autodetail.lovable.app

Hope you like it!`,
    preview_url: 'https://metairie-autodetail.lovable.app',
  },
};

// Errors log
let errorsStore: ErrorItem[] = [
  {
    id: 'err-101',
    timestamp: '2026-09-02T09:14:22Z',
    stage: 'Researched',
    lead_id: 'ChIJN1t_t_a1EIYRh_12009',
    business_name: 'Bayou Pest Control Experts',
    error_type: 'PLACES_API_TIMEOUT',
    message: 'Places API request timed out during social profile enrichment.',
    retryable: true,
  },
  {
    id: 'err-102',
    timestamp: '2026-09-02T10:05:11Z',
    stage: 'Site Briefed',
    lead_id: 'ChIJN1t_t_a1EIYRh_12026',
    business_name: 'Delta City Towing Services',
    error_type: 'NO_REACHABLE_CHANNEL',
    message: 'No WhatsApp number found and no email address extracted.',
    retryable: false,
  },
];

// Helper to calculate stage counts and summary metrics
function computeSummary() {
  const by_stage: Record<string, number> = {
    Discovered: 0,
    Researched: 0,
    'Site Briefed': 0,
    'Site Built': 0,
    'Email Drafted': 0,
    Sent: 0,
    Replied: 0,
    Closed: 0,
    Disqualified: 0,
  };

  leadsStore.forEach((l) => {
    by_stage[l.stage] = (by_stage[l.stage] || 0) + 1;
  });

  const setup_needed: string[] = [];
  if (!sheetCreated) setup_needed.push('sheet');
  if (!modelSettings.key_set) setup_needed.push('keys');
  if (!whatsappStatus.connected) setup_needed.push('whatsapp');

  const awaiting_approval = Object.values(briefsStore).filter(
    (b) => b.approval_status === 'Pending'
  ).length;

  const approved_unbuilt = Object.values(briefsStore).filter(
    (b) => b.approval_status === 'Approved' && !b.preview_url
  ).length;

  const to_research = by_stage['Discovered'] || 0;
  const to_brief = by_stage['Researched'] || 0;
  const to_draft = by_stage['Site Built'] || 0;
  const whatsapp_waiting = leadsStore.filter(
    (l) => l.whatsapp_reachable === 'unknown'
  ).length;

  return {
    total: leadsStore.length,
    by_stage,
    to_research,
    to_brief,
    disqualified: by_stage['Disqualified'] || 0,
    setup_needed,
    to_draft,
    awaiting_approval,
    approved_unbuilt,
    whatsapp_waiting,
    errors: errorsStore.length,
    errors_retryable: errorsStore.filter((e) => e.retryable).length,
    sheet_url: sheetUrl || undefined,
  };
}

// ------------------- API ROUTES -------------------

// GET /api/summary
app.get('/api/summary', (req, res) => {
  res.json(computeSummary());
});

// POST /api/create-sheet
app.post('/api/create-sheet', (req, res) => {
  sheetCreated = true;
  sheetTitle = 'Outreach Studio Pipeline - Google Sheet';
  sheetUrl = 'https://docs.google.com/spreadsheets/d/1OutreachStudio_Pipeline_Sheet_v1/edit#gid=0';
  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Created spreadsheet "${sheetTitle}" with 5 tabs in user Google Drive.`
  );
  res.json({ ok: true, url: sheetUrl, title: sheetTitle });
});

// GET /api/campaign
app.get('/api/campaign', (req, res) => {
  res.json(campaignSettings);
});

// POST /api/campaign
app.post('/api/campaign', (req, res) => {
  campaignSettings = { ...campaignSettings, ...req.body };
  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Updated campaign configuration for area: ${campaignSettings.location}.`
  );
  res.json({ ok: true });
});

// GET /api/model
app.get('/api/model', (req, res) => {
  res.json({
    provider: modelSettings.provider,
    model: modelSettings.model,
    key_set: modelSettings.key_set,
    places_key_set: modelSettings.places_key_set,
  });
});

// POST /api/model
app.post('/api/model', (req, res) => {
  const { provider, model, places_key, model_key } = req.body;
  if (provider) modelSettings.provider = provider;
  if (model) modelSettings.model = model;

  if (places_key) {
    modelSettings.places_key_secret = places_key;
    modelSettings.places_key_set = true;
  }
  if (model_key) {
    modelSettings.model_key_secret = model_key;
    modelSettings.key_set = true;
  }

  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Saved model credentials for ${modelSettings.provider} (${modelSettings.model}).`
  );
  res.json({ ok: true });
});

// GET /api/design-level
app.get('/api/design-level', (req, res) => {
  res.json(designLevelSettings);
});

// POST /api/design-level
app.post('/api/design-level', (req, res) => {
  designLevelSettings = { ...designLevelSettings, ...req.body };
  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Updated design level preferences: ${JSON.stringify(designLevelSettings)}`
  );
  res.json({ ok: true, design_level: designLevelSettings });
});

// GET /api/services
app.get('/api/services', (req, res) => {
  res.json(servicesSettings);
});

// POST /api/services
app.post('/api/services', (req, res) => {
  servicesSettings = { ...servicesSettings, ...req.body };
  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Updated enabled services: ${JSON.stringify(servicesSettings)}`
  );
  res.json({ ok: true, services: servicesSettings });
});

// POST /api/test-key
app.post('/api/test-key', (req, res) => {
  const { type, key } = req.body;
  if (type === 'places') {
    if (key && key.startsWith('invalid')) {
      return res.status(400).json({
        valid: false,
        error: 'Google Places API Error: API key expired or unauthorized for Places API v2.',
      });
    }
    return res.json({
      valid: true,
      message: 'Google Places API connection verified successfully (Places API v2).',
    });
  } else {
    if (key && key.startsWith('invalid')) {
      return res.status(400).json({
        valid: false,
        error: `${modelSettings.provider.toUpperCase()} API Error: Authentication failed. Incorrect API key provided.`,
      });
    }
    return res.json({
      valid: true,
      message: `${modelSettings.provider.toUpperCase()} model connection verified successfully (${modelSettings.model}).`,
    });
  }
});

// POST /api/suggest-areas
app.post('/api/suggest-areas', async (req, res) => {
  const { location, count } = req.body;
  const loc = location || 'New Orleans, LA, USA';
  const targetCount = count || 8;

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Suggest ${targetCount} specific prominent business districts, neighborhoods, or suburbs in or near "${loc}" for finding local service businesses. Return ONLY a JSON array of string names, e.g. ["Area 1", "Area 2"].`,
      });
      const text = response.text || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return res.json({ areas: parsed });
        }
      }
    } catch (err) {
      console.warn('Gemini area suggestion fallback:', err);
    }
  }

  const fallbackMap: Record<string, string[]> = {
    'new orleans': [
      'French Quarter',
      'Garden District',
      'Mid-City',
      'Uptown',
      'Marigny',
      'Bywater',
      'Algiers Point',
      'Metairie',
    ],
    austin: [
      'Downtown Austin',
      'South Congress (SoCo)',
      'East Austin',
      'Hyde Park',
      'Mueller',
      'Domain',
      'Westlake',
    ],
    chicago: [
      'Loop',
      'Lincoln Park',
      'Wicker Park',
      'Logan Square',
      'River North',
      'West Loop',
      'Lakeview',
    ],
  };

  const key = Object.keys(fallbackMap).find((k) => loc.toLowerCase().includes(k));
  const suggested = key
    ? fallbackMap[key].slice(0, targetCount)
    : [
        `Central ${loc.split(',')[0]}`,
        `North ${loc.split(',')[0]}`,
        `South ${loc.split(',')[0]}`,
        `East ${loc.split(',')[0]}`,
        `West ${loc.split(',')[0]}`,
        `Downtown ${loc.split(',')[0]}`,
      ].slice(0, targetCount);

  res.json({ areas: suggested });
});

// GET /api/leads
app.get('/api/leads', (req, res) => {
  res.json({ leads: leadsStore });
});

// GET /api/next-up
app.get('/api/next-up', (req, res) => {
  const nextLeads = leadsStore
    .filter((l) => l.stage === 'Discovered' || l.stage === 'Researched' || l.stage === 'Site Built')
    .slice(0, campaignSettings.perRunLimit);

  const to_research = leadsStore.filter((l) => l.stage === 'Discovered').length;
  const to_brief = leadsStore.filter((l) => l.stage === 'Researched').length;
  const to_build = Object.values(briefsStore).filter((b) => b.approval_status === 'Approved' && !b.preview_url).length;
  const to_send = leadsStore.filter((l) => l.stage === 'Site Built').length;

  res.json({
    queues: {
      to_research,
      to_brief,
      to_build,
      to_send,
    },
    cap: campaignSettings.perRunLimit,
    shown: nextLeads.length,
    names: nextLeads.map((l) => `${l.business_name} (${l.category})`),
    capped: leadsStore.length > campaignSettings.perRunLimit,
  });
});

// GET /api/reachability
app.get('/api/reachability', (req, res) => {
  const verified = leadsStore
    .filter((l) => l.whatsapp_reachable === 'yes')
    .map((l) => ({
      lead_id: l.place_id,
      business_name: l.business_name,
      phone: l.phone,
      e164_phone: formatE164(l.phone),
      whatsapp_reachable: 'yes' as const,
      email_found: researchStore[l.place_id]?.email_found,
      checked_at: l.whatsapp_checked_at || '2026-09-02T11:00:00Z',
      buildable_reason: 'Confirmed on WhatsApp — high outreach conversion',
    }));

  const rejected = leadsStore
    .filter((l) => l.whatsapp_reachable === 'no')
    .map((l) => {
      const email = researchStore[l.place_id]?.email_found;
      return {
        lead_id: l.place_id,
        business_name: l.business_name,
        phone: l.phone,
        e164_phone: formatE164(l.phone),
        whatsapp_reachable: 'no' as const,
        email_found: email,
        checked_at: l.whatsapp_checked_at || '2026-09-02T11:00:00Z',
        buildable_reason: email
          ? `No WhatsApp, but email found (${email}) — STILL BUILDABLE!`
          : 'No WhatsApp and no email found',
      };
    });

  const waiting = leadsStore
    .filter((l) => l.whatsapp_reachable === 'unknown')
    .map((l) => ({
      lead_id: l.place_id,
      business_name: l.business_name,
      phone: l.phone,
      e164_phone: formatE164(l.phone),
      whatsapp_reachable: 'unknown' as const,
      email_found: researchStore[l.place_id]?.email_found,
      checked_at: undefined,
      buildable_reason: 'Pending reachability verification run',
    }));

  const buildableCount = leadsStore.filter(
    (l) =>
      l.whatsapp_reachable === 'yes' ||
      (l.whatsapp_reachable === 'no' && researchStore[l.place_id]?.email_found)
  ).length;

  res.json({
    verified,
    rejected,
    waiting,
    counts: {
      verified: verified.length,
      rejected: rejected.length,
      waiting: waiting.length,
      buildable: buildableCount,
    },
  });
});

// POST /api/whatsapp/check-batch
app.post('/api/whatsapp/check-batch', (req, res) => {
  let checked = 0;
  let newly_verified = 0;

  leadsStore = leadsStore.map((l) => {
    if (l.whatsapp_reachable === 'unknown') {
      checked++;
      const isReachable = Math.random() > 0.2;
      if (isReachable) newly_verified++;
      return {
        ...l,
        whatsapp_reachable: isReachable ? ('yes' as const) : ('no' as const),
        whatsapp_checked_at: new Date().toISOString(),
      };
    }
    return l;
  });

  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Checked ${checked} leads for WhatsApp reachability. ${newly_verified} verified.`
  );

  res.json({ checked, newly_verified });
});

// GET /api/review-queue
app.get('/api/review-queue', (req, res) => {
  const queue = Object.values(briefsStore).filter(
    (b) => b.approval_status === 'Pending'
  );
  res.json({ queue });
});

// POST /api/decide
app.post('/api/decide', (req, res) => {
  const lead_id = req.body.lead_id || req.body.place_id;
  const { decision } = req.body;

  if (!lead_id || !briefsStore[lead_id]) {
    return res.status(404).json({ error: 'Brief not found for specified lead_id' });
  }

  if (decision === 'approve') {
    briefsStore[lead_id].approval_status = 'Approved';
    const lead = leadsStore.find((l) => l.place_id === lead_id);
    if (lead) lead.stage = 'Researched';
    runnerState.lines.push(
      `[${new Date().toLocaleTimeString()}] Approved site brief for "${briefsStore[lead_id].business_name}".`
    );
  } else if (decision === 'skip') {
    briefsStore[lead_id].approval_status = 'Skip';
    const lead = leadsStore.find((l) => l.place_id === lead_id);
    if (lead) lead.stage = 'Disqualified';
    runnerState.lines.push(
      `[${new Date().toLocaleTimeString()}] Skipped brief for "${briefsStore[lead_id].business_name}". Lead marked as disqualified.`
    );
  } else if (decision === 'later') {
    briefsStore[lead_id].approval_status = 'Later';
    runnerState.lines.push(
      `[${new Date().toLocaleTimeString()}] Deferred decision for brief "${briefsStore[lead_id].business_name}" to later.`
    );
  }

  res.json({ ok: true, lead_id, decision });
});

// POST /api/regenerate
app.post('/api/regenerate', async (req, res) => {
  const lead_id = req.body.lead_id || req.body.place_id;
  const notes = req.body.notes || req.body.instruction || '';
  const brief = briefsStore[lead_id];
  if (!brief) return res.status(404).json({ error: 'Brief not found' });

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Rewrite this Lovable website generator prompt for "${brief.business_name}" (${brief.research_summary?.category || 'SME'}). Focus on high conversion, modern UI, instant booking, and trust signals.
${notes ? `User notes / instructions: "${notes}"` : ''}
Current prompt: ${brief.lovable_prompt}`,
      });
      if (response.text) {
        brief.lovable_prompt = response.text.trim();
        return res.json({ prompt: brief.lovable_prompt });
      }
    } catch (err) {
      console.warn('Gemini regenerate prompt fallback:', err);
    }
  }

  brief.lovable_prompt = `Build an elevated, conversion-optimized website for "${brief.business_name}".
${notes ? `Custom notes applied: ${notes}\n` : ''}Hero Section: Clear value proposition, 5-star review trust counter, and prominent high-visibility CTA ("Call Now / Get Quote").
Interactive Service Configurator: Allow customers to select services and get immediate pricing or callback requests.
Local Trust Signals: Verified Google Reviews carousel and neighborhood coverage list.
Mobile Optimizations: Sticky phone bar, fast layout, accessible contrast, and high-converting contact forms.`;

  res.json({ prompt: brief.lovable_prompt });
});

// POST /api/outreach/rewrite
app.post('/api/outreach/rewrite', async (req, res) => {
  const lead_id = req.body.lead_id || req.body.place_id;
  const instruction = req.body.instruction || req.body.notes || 'Make it friendly and concise';
  const draft = sendQueueStore[lead_id];
  const lead = leadsStore.find((l) => l.place_id === lead_id);

  if (!draft || !lead) {
    return res.status(404).json({ error: 'Lead or draft message not found' });
  }

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Rewrite this WhatsApp outreach message for business "${lead.business_name}" based on instruction: "${instruction}".
Original message: ${draft.whatsapp_message}
Keep it friendly, concise, non-spammy, and preserve the website link: ${draft.preview_url}`,
      });
      if (response.text) {
        draft.whatsapp_message = response.text.trim();
        return res.json({ message: draft.whatsapp_message });
      }
    } catch (err) {
      console.warn('Gemini outreach rewrite fallback:', err);
    }
  }

  if (instruction.toLowerCase().includes('shorter')) {
    draft.whatsapp_message = `Hi ${lead.business_name}! 👋 We built a fast 1-minute demo website for your business:
👉 ${draft.preview_url}
Check it out and let us know if you'd like to make it official!`;
  } else if (instruction.toLowerCase().includes('discount') || instruction.toLowerCase().includes('offer')) {
    draft.whatsapp_message = `Hi ${lead.business_name}! 👋 We built a custom website demo for your business:
👉 ${draft.preview_url}
If you like it, we can set up your official domain and email hosting with 50% off this month! Let us know what you think.`;
  } else {
    draft.whatsapp_message = `Hi ${lead.business_name}! ${instruction}\n\n👉 ${draft.preview_url}\nLet us know if you have any questions!`;
  }

  res.json({ message: draft.whatsapp_message });
});

// POST /api/drop
app.post('/api/drop', (req, res) => {
  const lead_id = req.body.lead_id || req.body.place_id;
  const lead = leadsStore.find((l) => l.place_id === lead_id);
  if (lead) {
    lead.stage = 'Disqualified';
    runnerState.lines.push(
      `[${new Date().toLocaleTimeString()}] Lead "${lead.business_name}" dropped / disqualified.`
    );
  }
  res.json({ ok: true, lead_id });
});

// GET /api/build-queue
app.get('/api/build-queue', (req, res) => {
  const approvedBriefs = Object.values(briefsStore).filter(
    (b) => b.approval_status === 'Approved' && !b.preview_url
  );

  const queue = approvedBriefs.map((b) => {
    const lead = leadsStore.find((l) => l.place_id === b.lead_id)!;
    return {
      lead_id: b.lead_id,
      business_name: b.business_name,
      category: lead?.category || 'SME',
      lovable_prompt: b.lovable_prompt,
      preview_url: b.preview_url,
      stage: lead?.stage || 'Researched',
      country: lead?.country || 'United States',
      address: lead?.address || '',
      created_at: b.created_at,
    };
  });

  res.json({ queue });
});

// POST /api/record-build
app.post('/api/record-build', (req, res) => {
  const lead_id = req.body.lead_id || req.body.place_id;
  const preview_url = req.body.preview_url || req.body.url;
  if (!preview_url || !preview_url.startsWith('http')) {
    return res.status(400).json({ error: 'Valid URL starting with http:// or https:// is required' });
  }

  const brief = briefsStore[lead_id];
  if (brief) {
    brief.preview_url = preview_url;
  }

  const lead = leadsStore.find((l) => l.place_id === lead_id);
  if (lead) {
    lead.stage = 'Site Built';
    lead.website_url = preview_url;
  }

  const bizName = lead ? lead.business_name : 'your business';
  sendQueueStore[lead_id] = {
    whatsapp_message: `Hi team at ${bizName}! 👋 We built a custom high-converting website prototype tailored specifically for your services:

👉 ${preview_url}

Take a look when you get a moment! We can connect it to your custom domain in 5 minutes.`,
    preview_url,
  };

  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Recorded built site preview for "${bizName}" (${preview_url}). Stage updated to "Site Built".`
  );

  res.json({
    ok: true,
    lead_id,
    screenshot_url: `/api/screenshot/${encodeURIComponent(lead_id)}`,
  });
});

// GET /api/screenshot/:id
app.get(['/api/screenshot/:id', '/api/screenshot/lead/:id'], (req, res) => {
  const lead_id = req.params.id;
  const lead = leadsStore.find((l) => l.place_id === lead_id);
  const title = lead ? lead.business_name : 'SME Website';
  const category = lead ? lead.category : 'Service Business';
  const url = lead?.website_url || 'https://demo.lovable.app';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
  </defs>
  <rect width="600" height="380" rx="12" fill="url(#bg)"/>
  <rect x="0" y="0" width="600" height="36" rx="12" fill="#334155"/>
  <rect x="0" y="24" width="600" height="12" fill="#334155"/>
  <circle cx="20" cy="18" r="5" fill="#ef4444"/>
  <circle cx="36" cy="18" r="5" fill="#eab308"/>
  <circle cx="52" cy="18" r="5" fill="#22c55e"/>
  <rect x="80" y="8" width="440" height="20" rx="6" fill="#1e293b"/>
  <text x="92" y="22" font-family="system-ui, sans-serif" font-size="11" fill="#94a3b8">${escapeXml(
    url
  )}</text>
  <rect x="16" y="52" width="568" height="312" rx="8" fill="url(#cardBg)"/>
  <rect x="36" y="72" width="528" height="110" rx="6" fill="#0284c7"/>
  <text x="56" y="102" font-family="system-ui, sans-serif" font-weight="bold" font-size="20" fill="#ffffff">${escapeXml(
    title
  )}</text>
  <text x="56" y="125" font-family="system-ui, sans-serif" font-size="13" fill="#e0f2fe">${escapeXml(
    category
  )} • New Orleans, LA</text>
  <rect x="56" y="142" width="130" height="28" rx="14" fill="#ffffff"/>
  <text x="76" y="160" font-family="system-ui, sans-serif" font-weight="600" font-size="11" fill="#0284c7">★ 4.9 Instant Quote</text>
  <rect x="36" y="200" width="160" height="90" rx="6" fill="#f1f5f9" stroke="#e2e8f0"/>
  <text x="48" y="222" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#334155">Fast Service</text>
  <rect x="48" y="234" width="120" height="8" rx="4" fill="#cbd5e1"/>
  <rect x="48" y="248" width="90" height="8" rx="4" fill="#cbd5e1"/>
  <rect x="212" y="200" width="160" height="90" rx="6" fill="#f1f5f9" stroke="#e2e8f0"/>
  <text x="224" y="222" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#334155">Verified Reviews</text>
  <rect x="224" y="234" width="120" height="8" rx="4" fill="#cbd5e1"/>
  <rect x="224" y="248" width="100" height="8" rx="4" fill="#cbd5e1"/>
  <rect x="388" y="200" width="176" height="90" rx="6" fill="#0f172a"/>
  <text x="402" y="222" font-family="system-ui, sans-serif" font-weight="bold" font-size="12" fill="#38bdf8">Book Online</text>
  <rect x="402" y="236" width="140" height="22" rx="4" fill="#0284c7"/>
  <text x="430" y="251" font-family="system-ui, sans-serif" font-weight="600" font-size="10" fill="#ffffff">Confirm Booking</text>
  <rect x="36" y="306" width="528" height="40" rx="4" fill="#e2e8f0"/>
  <text x="48" y="330" font-family="system-ui, sans-serif" font-size="11" fill="#64748b">Built with Outreach Studio • 2026</text>
</svg>`;

  res.setHeader('Content-Type', 'image/svg+xml');
  res.send(svg);
});

// POST /api/run
app.post('/api/run', (req, res) => {
  const { what, limit, social_first } = req.body;
  const runLimit = limit || campaignSettings.perRunLimit;

  runnerState.running = what;
  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Started batch run: "${what}" (Limit: ${runLimit} items${
      social_first ? ', Social-First: true' : ''
    })...`
  );

  if (social_first) {
    leadsStore.sort((a, b) => (a.website_status === 'social_only' ? -1 : 1));
  }

  setTimeout(() => {
    if (what === 'discovery' || what === 'full') {
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Discovery] Querying Google Places API v2 for category "${campaignSettings.category}" in ${campaignSettings.location}...`
      );
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Discovery] Discovered 4 new leads with website_status: "none". Added to Google Sheet tab "Leads".`
      );
    }

    if (what === 'research' || what === 'full') {
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Research] Enriching social handles, Google review sentiment, and contact info...`
      );
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Research] Generated customer pain-points and recommended website angle for batch.`
      );
    }

    if (what === 'reachability' || what === 'full') {
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Reachability] Calling WhatsApp Local Relay on ${whatsappStatus.relayUrl}...`
      );
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Reachability] Verified 8 leads on WhatsApp. 2 flagged as email-only.`
      );
    }

    if (what === 'site-brief' || what === 'full') {
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Site Brief] Writing Lovable prompts with custom tone and local praise signals...`
      );
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Site Brief] 5 new site briefs ready in Review Queue.`
      );
    }

    if (what === 'outreach-draft' || what === 'full') {
      runnerState.lines.push(
        `[${new Date().toLocaleTimeString()}] [Outreach Draft] Writing WhatsApp personalized pitch messages...`
      );
    }

    runnerState.lines.push(
      `[${new Date().toLocaleTimeString()}] Batch run "${what}" completed successfully.`
    );
    runnerState.running = null;
  }, 2500);

  res.json({ started: true, what, limit: runLimit, social_first: !!social_first });
});

// GET /api/log
app.get('/api/log', (req, res) => {
  res.json(runnerState);
});

// GET /api/whatsapp/status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    connected: whatsappStatus.connected,
    enabled: whatsappStatus.state !== 'disconnected',
    state: whatsappStatus.state,
    number: whatsappStatus.number,
    relayUrl: whatsappStatus.relayUrl,
  });
});

// GET /api/whatsapp/qr
app.get('/api/whatsapp/qr', (req, res) => {
  if (whatsappStatus.connected) {
    return res.json({ qr: null });
  }
  const qrSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#ffffff" rx="8"/>
  <rect x="20" y="20" width="50" height="50" fill="#0f172a"/>
  <rect x="30" y="30" width="30" height="30" fill="#ffffff"/>
  <rect x="38" y="38" width="14" height="14" fill="#25d366"/>
  <rect x="130" y="20" width="50" height="50" fill="#0f172a"/>
  <rect x="140" y="30" width="30" height="30" fill="#ffffff"/>
  <rect x="148" y="38" width="14" height="14" fill="#25d366"/>
  <rect x="20" y="130" width="50" height="50" fill="#0f172a"/>
  <rect x="30" y="140" width="30" height="30" fill="#ffffff"/>
  <rect x="38" y="148" width="14" height="14" fill="#25d366"/>
  <rect x="80" y="20" width="12" height="12" fill="#0f172a"/>
  <rect x="100" y="35" width="12" height="12" fill="#0f172a"/>
  <rect x="80" y="60" width="12" height="12" fill="#25d366"/>
  <rect x="30" y="80" width="12" height="12" fill="#0f172a"/>
  <rect x="55" y="80" width="12" height="12" fill="#0f172a"/>
  <rect x="80" y="90" width="25" height="25" fill="#25d366" rx="4"/>
  <rect x="120" y="80" width="12" height="12" fill="#0f172a"/>
  <rect x="145" y="95" width="12" height="12" fill="#0f172a"/>
  <rect x="170" y="80" width="12" height="12" fill="#25d366"/>
  <rect x="80" y="130" width="12" height="12" fill="#0f172a"/>
  <rect x="100" y="150" width="12" height="12" fill="#25d366"/>
  <rect x="130" y="130" width="20" height="20" fill="#0f172a"/>
  <rect x="160" y="150" width="20" height="20" fill="#0f172a"/>
</svg>`;

  res.json({ qr: qrSvg });
});

// GET /api/whatsapp/queue
app.get('/api/whatsapp/queue', (req, res) => {
  const builtLeads = leadsStore.filter((l) => l.stage === 'Site Built' || l.stage === 'Sent');

  const queue = builtLeads.map((l) => {
    const draftData = sendQueueStore[l.place_id] || {
      whatsapp_message: `Hi ${l.business_name}! We built a custom site preview for your business: ${
        l.website_url || 'https://demo.lovable.app'
      }`,
      preview_url: l.website_url || 'https://demo.lovable.app',
    };

    return {
      lead_id: l.place_id,
      business_name: l.business_name,
      category: l.category,
      recipient_phone: l.phone,
      e164_phone: formatE164(l.phone),
      whatsapp_message: draftData.whatsapp_message,
      preview_url: draftData.preview_url,
      screenshot_url: `/api/screenshot/${encodeURIComponent(l.place_id)}`,
      stage: l.stage,
      drafted_at: l.discovered_at,
      status: (l.owner_notes?.includes('Sent status:') ? 'sent' : undefined) as SendStatus | undefined,
    };
  });

  const excluded = leadsStore
    .filter((l) => l.whatsapp_reachable === 'no' && l.stage === 'Site Built')
    .map((l) => ({
      name: l.business_name,
      phone: l.phone,
      reason: 'No WhatsApp on number (Email channel available)',
    }));

  res.json({ queue, excluded });
});

// POST /api/whatsapp/send
app.post('/api/whatsapp/send', (req, res) => {
  const lead_id = req.body.lead_id || req.body.place_id;
  const customMessage = req.body.message || req.body.customMessage;
  const phone_e164 = req.body.phone_e164;
  const lead = leadsStore.find((l) => l.place_id === lead_id);

  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (customMessage && sendQueueStore[lead_id]) {
    sendQueueStore[lead_id].whatsapp_message = customMessage;
  }

  if (phone_e164) {
    lead.phone = phone_e164;
  }

  lead.stage = 'Sent';
  lead.owner_notes = `Sent status: delivered on ${new Date().toLocaleTimeString()}`;

  runnerState.lines.push(
    `[${new Date().toLocaleTimeString()}] Sent WhatsApp message to "${lead.business_name}" (${formatE164(
      lead.phone
    )}) via Local Relay. Status: delivered.`
  );

  res.json({
    status: 'delivered',
    detail: 'Message handed off to WhatsApp Local Relay successfully.',
  });
});

// POST /api/whatsapp/undo-send
app.post('/api/whatsapp/undo-send', (req, res) => {
  const lead_id = req.body.lead_id || req.body.place_id;
  const lead = leadsStore.find((l) => l.place_id === lead_id);
  if (lead) {
    lead.stage = 'Site Built';
    lead.owner_notes = 'Send undone: moved back to site built queue';
    runnerState.lines.push(`[${new Date().toLocaleTimeString()}] Undone WhatsApp send for "${lead.business_name}".`);
  }
  res.json({ ok: true, lead_id });
});

// POST /api/whatsapp/skip
app.post('/api/whatsapp/skip', (req, res) => {
  const lead_id = req.body.lead_id || req.body.place_id;
  const lead = leadsStore.find((l) => l.place_id === lead_id);
  if (lead) {
    lead.stage = 'Disqualified';
    lead.owner_notes = 'Skipped in WhatsApp queue';
    runnerState.lines.push(`[${new Date().toLocaleTimeString()}] Skipped WhatsApp outreach for "${lead.business_name}".`);
  }
  res.json({ ok: true, lead_id });
});

// POST /api/whatsapp/reset
app.post('/api/whatsapp/reset', (req, res) => {
  whatsappStatus.connected = false;
  whatsappStatus.number = '';
  whatsappStatus.state = 'disconnected';
  runnerState.lines.push(`[${new Date().toLocaleTimeString()}] Reset WhatsApp relay connection.`);
  res.json({ ok: true, status: whatsappStatus });
});

// POST /api/lead-note
app.post('/api/lead-note', (req, res) => {
  const { lead_id, note } = req.body;
  const lead = leadsStore.find((l) => l.place_id === lead_id);
  if (lead) {
    lead.owner_notes = note;
    res.json({ ok: true });
  } else {
    res.status(404).json({ error: 'Lead not found' });
  }
});

function formatE164(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return `+1${digits}`;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ------------------- VITE / SERVING -------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Outreach Studio Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
