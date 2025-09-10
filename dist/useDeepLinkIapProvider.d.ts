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
    setInsertAffiliateIdentifierChangeCallback: (callback: import("./DeepLinkIapProvider").InsertAffiliateIdentifierChangeCallback | null) => void;
    handleInsertLinks: (url: string) => Promise<boolean>;
    initialize: (code: string | null, verboseLogging?: boolean, insertLinksEnabled?: boolean, insertLinksClipboardEnabled?: boolean) => Promise<void>;
    isInitialized: boolean;
    OfferCode: string | null;
};
export default useDeepLinkIapProvider;
