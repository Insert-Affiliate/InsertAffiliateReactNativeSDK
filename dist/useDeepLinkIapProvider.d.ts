declare const useDeepLinkIapProvider: () => {
    alreadyPurchased: boolean;
    handleBuySubscription: (productId: string, offerToken?: string) => void;
    iapLoading: boolean;
    referrerLink: string;
    subscriptions: import("react-native-iap").Subscription[];
    userId: string;
    isIapticValidated: boolean | undefined;
    userPurchase: import("react-native-iap").Purchase | null;
    trackEvent: (eventName: string) => Promise<void>;
    initialize: (code: string | null) => Promise<void>;
};
export default useDeepLinkIapProvider;
