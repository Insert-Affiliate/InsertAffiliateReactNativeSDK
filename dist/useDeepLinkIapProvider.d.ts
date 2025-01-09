declare const useDeepLinkIapProvider: () => {
    referrerLink: string;
    userId: string;
    handlePurchaseValidation: (jsonIapPurchase: import("react-native-iap").Purchase) => void;
    isIapticValidated: boolean | undefined;
    trackEvent: (eventName: string) => Promise<void>;
    setInsertAffiliateIdentifier: (referringLink: string, completion: (shortLink: string | null) => void) => Promise<void>;
    initialize: (code: string | null) => Promise<void>;
    isInitialized: boolean;
};
export default useDeepLinkIapProvider;
