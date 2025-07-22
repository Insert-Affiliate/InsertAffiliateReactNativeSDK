declare const useDeepLinkIapProvider: () => {
    referrerLink: string;
    userId: string;
    validatePurchaseWithIapticAPI: (jsonIapPurchase: {
        [key: string]: any;
    }, iapticAppId: string, iapticAppName: string, iapticPublicKey: string) => Promise<boolean>;
    storeExpectedStoreTransaction: (purchaseToken: string) => Promise<void>;
    returnUserAccountTokenAndStoreExpectedTransaction: () => Promise<string | null>;
    returnInsertAffiliateIdentifier: () => Promise<string | null>;
    trackEvent: (eventName: string) => Promise<void>;
    setShortCode: (shortCode: string) => Promise<void>;
    setInsertAffiliateIdentifier: (referringLink: string) => Promise<void | string>;
    initialize: (code: string | null, verboseLogging?: boolean) => Promise<void>;
    isInitialized: boolean;
    iOSOfferCode: string | null;
};
export default useDeepLinkIapProvider;
