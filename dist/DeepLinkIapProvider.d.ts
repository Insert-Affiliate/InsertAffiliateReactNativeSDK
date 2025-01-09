import React from "react";
import { Purchase } from "react-native-iap";
type T_DEEPLINK_IAP_PROVIDER = {
    children: React.ReactNode;
    iapSkus: string[];
    iapticAppId: string;
    iapticAppName: string;
    iapticPublicKey: string;
};
type T_DEEPLINK_IAP_CONTEXT = {
    referrerLink: string;
    userId: string;
    isIapticValidated: boolean | undefined;
    handlePurchaseValidation: (jsonIapPurchase: Purchase) => void;
    trackEvent: (eventName: string) => Promise<void>;
    setInsertAffiliateIdentifier: (referringLink: string, completion: (shortLink: string | null) => void) => Promise<void>;
    initialize: (code: string | null) => Promise<void>;
    isInitialized: boolean;
};
export declare const DeepLinkIapContext: React.Context<T_DEEPLINK_IAP_CONTEXT>;
declare const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER>;
export default DeepLinkIapProvider;
