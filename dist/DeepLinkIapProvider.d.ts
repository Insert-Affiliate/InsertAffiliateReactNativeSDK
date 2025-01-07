import React from "react";
import { Purchase, Subscription } from "react-native-iap";
type T_DEEPLINK_IAP_PROVIDER = {
    children: React.ReactNode;
    iapSkus: string[];
    iapticAppId: string;
    iapticAppName: string;
    iapticPublicKey: string;
};
type T_DEEPLINK_IAP_CONTEXT = {
    iapLoading: boolean;
    alreadyPurchased: boolean;
    subscriptions: Subscription[];
    userPurchase: Purchase | null;
    referrerLink: string;
    userId: string;
    isIapticValidated: boolean | undefined;
    handleBuySubscription: (productId: string, offerToken?: string) => void;
    trackEvent: (eventName: string) => Promise<void>;
    setInsertAffiliateIdentifier: (referringLink: string, completion: (shortLink: string | null) => void) => Promise<void>;
    initialize: (code: string | null) => Promise<void>;
    isInitialized: boolean;
};
export declare const DeepLinkIapContext: React.Context<T_DEEPLINK_IAP_CONTEXT>;
declare const _default: (props: T_DEEPLINK_IAP_PROVIDER) => React.JSX.Element;
export default _default;
