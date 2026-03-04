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
}
