export type ReferrerAffiliate = {
    affiliateName: string;
    affiliateShortCode: string;
    deeplinkurl: string;
};
export type ReferralTrigger = 'install' | 'event' | 'purchase';
export type ReferralRewardStore = 'app_store' | 'google_play' | (string & {});
export type ReferralRewardCode = {
    code: string;
    redeemUrl: string;
    store: ReferralRewardStore;
    grantedAt: string | null;
};
export type ReferrerAccountOptions = {
    appUserId?: string;
    playPurchaseToken?: string;
};
export type MyAffiliateDetails = ReferrerAffiliate & {
    referralTrigger: ReferralTrigger;
    referralCount: number;
    installCount: number;
    eventCount: number;
    purchaseCount: number;
    totalEarned: number;
    totalPaid: number;
    totalUnpaid: number;
    currency: string;
    dashboardUrl: string;
    rewardsGranted: number;
    premiumUntil: string | null;
    rewardCodes: ReferralRewardCode[];
};
export type ReferralProgramConfig = {
    enabled: boolean;
    companyName: string;
    referralTrigger: ReferralTrigger;
    headline: string;
    rewardText: string;
    primaryColor: string;
};
export type ReferralEnrolStatus = 'created' | 'connected' | 'verificationRequired' | 'error';
export type ReferralErrorCode = 'INVALID_EMAIL' | 'INVALID_COMPANY_ID' | 'INVALID_CODE' | 'PROGRAM_DISABLED' | 'AFFILIATE_LIMIT_REACHED' | 'COMPANY_NOT_FOUND' | 'TOO_MANY_CODES' | 'RATE_LIMITED' | 'NETWORK_ERROR' | 'NOT_INITIALIZED' | string;
export type ReferralEnrolResult = {
    status: ReferralEnrolStatus;
    affiliate?: ReferrerAffiliate;
    errorCode?: ReferralErrorCode;
    errorMessage?: string;
};
export type ReferralDeps = {
    getCompanyId: () => Promise<string | null>;
    getDeviceId: () => Promise<string | null>;
    verboseLog: (message: string) => void;
    errorLog: (message: string, error?: unknown) => void;
};
export declare const parseReferrerAffiliate: (data: any) => ReferrerAffiliate;
export declare const parseRewardCodes: (value: unknown) => ReferralRewardCode[];
export declare const rewardCodesForPlatform: (codes: ReferralRewardCode[], os: string) => ReferralRewardCode[];
export declare const isPremiumActive: (premiumUntil: string | null, now?: number) => boolean;
export declare const parseMyAffiliateDetails: (data: any) => MyAffiliateDetails;
export declare const parseReferralProgramConfig: (data: any) => ReferralProgramConfig;
export declare const parseEnrolResponse: (httpStatus: number, data: any) => {
    result: ReferralEnrolResult;
    token: string | null;
};
export declare const buildReferralShareText: (affiliate: ReferrerAffiliate, companyName: string, message?: string) => string;
export declare const isTokenRejected: (httpStatus: number, data: any) => boolean;
export declare const createAffiliateForUser: (deps: ReferralDeps, email: string, name: string, options?: ReferrerAccountOptions) => Promise<ReferralEnrolResult>;
export declare const verifyAffiliateCode: (deps: ReferralDeps, email: string, code: string, name?: string, options?: ReferrerAccountOptions) => Promise<ReferralEnrolResult>;
export declare const getMyAffiliateDetails: (deps: ReferralDeps) => Promise<MyAffiliateDetails | null>;
export declare const setReferrerAccount: (deps: ReferralDeps, options: ReferrerAccountOptions) => Promise<boolean>;
export declare const isUserAnAffiliate: (deps: ReferralDeps) => Promise<boolean>;
export declare const signOutAffiliate: (deps: ReferralDeps) => Promise<void>;
export declare const getReferralProgramConfig: (deps: ReferralDeps) => Promise<ReferralProgramConfig | null>;
export declare const shareReferralLink: (deps: ReferralDeps, message?: string) => Promise<boolean>;
export declare const openShareSheet: (text: string, deps?: Pick<ReferralDeps, "errorLog">) => Promise<boolean>;
