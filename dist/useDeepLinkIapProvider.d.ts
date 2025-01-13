declare const useDeepLinkIapProvider: () => {
    referrerLink: string;
    userId: string;
    handlePurchaseValidation: (jsonIapPurchase: {
        [key: string]: any;
    }) => Promise<boolean>;
    trackEvent: (eventName: string) => Promise<void>;
    setShortCode: (shortCode: string) => void;
    setInsertAffiliateIdentifier: (referringLink: string, completion: (shortLink: string | null) => void) => Promise<void>;
    initialize: (code: string | null) => Promise<void>;
    isInitialized: boolean;
};
export default useDeepLinkIapProvider;
