import React from "react";
type T_DEEPLINK_IAP_PROVIDER = {
    children: React.ReactNode;
    iapSkus: string[];
    iapticAppId: string;
    iapticAppName: string;
    iapticPublicKey: string;
};
type CustomPurchase = {
    [key: string]: any;
};
type T_DEEPLINK_IAP_CONTEXT = {
    referrerLink: string;
    userId: string;
    handlePurchaseValidation: (jsonIapPurchase: CustomPurchase) => Promise<boolean>;
    trackEvent: (eventName: string) => Promise<void>;
    setInsertAffiliateIdentifier: (referringLink: string, completion: (shortLink: string | null) => void) => Promise<void>;
    initialize: (code: string | null) => Promise<void>;
    isInitialized: boolean;
};
export declare const DeepLinkIapContext: React.Context<T_DEEPLINK_IAP_CONTEXT>;
declare const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER>;
export default DeepLinkIapProvider;
