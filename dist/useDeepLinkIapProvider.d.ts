declare const useDeepLinkIapProvider: () => {
    referrerLink: string;
    userId: string;
    validatePurchaseWithIapticAPI: (jsonIapPurchase: {
        [key: string]: any;
    }, iapticAppId: string, iapticAppName: string, iapticPublicKey: string) => Promise<boolean>;
    returnInsertAffiliateIdentifier: () => Promise<string | null>;
    trackEvent: (eventName: string) => Promise<void>;
    setShortCode: (shortCode: string) => Promise<void>;
    setInsertAffiliateIdentifier: (referringLink: string) => Promise<void>;
    initialize: (code: string | null) => Promise<void>;
    isInitialized: boolean;
};
export default useDeepLinkIapProvider;
