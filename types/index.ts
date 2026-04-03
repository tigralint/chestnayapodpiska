/**
 * Client-side type definitions.
 * 
 * NOTE: ClaimData & CourseData here represent the *form state* — turnstileToken is optional
 * because the Turnstile widget delivers it asynchronously. The server-side Zod schemas
 * in api/generateClaim.ts enforce turnstileToken as required (.min(1)) at the *wire* level.
 * This is intentional: form state ≠ wire format.
 */

export type Tone = 'soft' | 'hard';

export interface ClaimData {
    serviceName: string;
    amount: string;
    date: string;
    reason: string;
    customReason?: string;
    tone: Tone;
    turnstileToken?: string;
}

export interface CourseData {
    courseName: string;
    totalCost: number;
    percentCompleted: number;
    tone: Tone;
    hasPlatformAccess: boolean;
    hasConsultations: boolean;
    hasCertificate: boolean;
    turnstileToken?: string;
}

export type ClaimPayload =
    | { type: 'subscription'; data: ClaimData }
    | { type: 'course'; data: CourseData; calculatedRefund: number };

export interface GenerateClaimResponse {
    text?: string;
    error?: string;
    details?: string;
}

export interface Guide {
    id: string;
    service: string;
    aliases: string[];
    iconColor: string;
    type: 'subscription' | 'course';
    steps: string[];
    contactEmail?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    lastUpdated?: string;
    tags?: string[];
}

export type AlertCategory = 
  'hidden_cancel' | 'auto_renewal' | 'dark_pattern' | 
  'phishing' | 'refund_refused' | 'other';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'success';

/** Shape of a radar report stored in Redis (used by api/radar.ts and api/tgWebhook.ts) */
export interface RadarStoredData {
  id: string;
  timestamp: number;
  serviceName: string;
  city: string;
  amount?: number;
  description: string;
  category: AlertCategory;
}

export interface RadarReport {
  serviceName: string;
  city: string;
  amount?: number;
  description: string;
  category: AlertCategory;
  turnstileToken: string;
}

export interface RadarAlertResponse {
  id: string;
  location: string;
  time: string;           
  text: string;
  severity: AlertSeverity;
  category: AlertCategory;
  serviceName: string;
  reportCount: number;     
}
