declare const useDeepLinkIapProvider: () => {
    referrerLink: string;
    userId: string;
    validatePurchaseWithIapticAPI: (jsonIapPurchase: {
        [key: string]: any;
    }, iapticAppId: string, iapticAppName: string, iapticPublicKey: string) => Promise<boolean>;
    storeExpectedStoreTransaction: (purchaseToken: string) => Promise<void>;
    returnUserAccountTokenAndStoreExpectedTransaction: () => Promise<string | null>;
    returnInsertAffiliateIdentifier: (ignoreTimeout?: boolean) => Promise<string | null>;
    isAffiliateAttributionValid: () => Promise<boolean>;
    getAffiliateStoredDate: () => Promise<Date | null>;
    getAffiliateExpiryTimestamp: () => Promise<number | null>;
    trackEvent: (eventName: string) => Promise<void>;
    setShortCode: (shortCode: string, options?: {
        onLookupFailed?: () => void;
    }) => Promise<boolean>;
    getAffiliateDetails: (affiliateCode: string) => Promise<import("./DeepLinkIapProvider").AffiliateDetails>;
    getAffiliateLookupResult: (affiliateCode: string, trackUsage?: boolean) => Promise<import("./DeepLinkIapProvider").AffiliateLookupResult>;
    setInsertAffiliateIdentifier: (referringLink: string) => Promise<void | string>;
    setInsertAffiliateIdentifierChangeCallback: (callback: import("./DeepLinkIapProvider").InsertAffiliateIdentifierChangeCallback | null) => void;
    handleInsertLinks: (url: string) => Promise<boolean>;
    initialize: (code: string | null, verboseLogging?: boolean, insertLinksEnabled?: boolean, insertLinksClipboardEnabled?: boolean, affiliateAttributionActiveTime?: number, preventAffiliateTransfer?: boolean) => Promise<void>;
    setLogger: (logger: import("./DeepLinkIapProvider").InsertAffiliateLogger) => void;
    isInitialized: boolean;
    OfferCode: string | null;
    createAffiliateForUser: (email: string, name: string) => Promise<import("./referrals").ReferralEnrolResult>;
    verifyAffiliateCode: (email: string, code: string, name?: string) => Promise<import("./referrals").ReferralEnrolResult>;
    getMyAffiliateDetails: () => Promise<import("./referrals").MyAffiliateDetails | null>;
    isUserAnAffiliate: () => Promise<boolean>;
    signOutAffiliate: () => Promise<void>;
    getReferralProgramConfig: () => Promise<import("./referrals").ReferralProgramConfig | null>;
    shareReferralLink: (message?: string) => Promise<boolean>;
};
export default useDeepLinkIapProvider;
