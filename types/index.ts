export type Tone = 'soft' | 'hard';

export interface ClaimData {
    serviceName: string;
    amount: string;
    date: string;
    reason: string;
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
