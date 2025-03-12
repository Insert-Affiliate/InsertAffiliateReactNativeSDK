import React from 'react';
type T_DEEPLINK_IAP_PROVIDER = {
    children: React.ReactNode;
};
type CustomPurchase = {
    [key: string]: any;
};
type T_DEEPLINK_IAP_CONTEXT = {
    referrerLink: string;
    userId: string;
    returnInsertAffiliateIdentifier: () => Promise<string | null>;
    validatePurchaseWithIapticAPI: (jsonIapPurchase: CustomPurchase, iapticAppId: string, iapticAppName: string, iapticPublicKey: string) => Promise<boolean>;
    storeExpectedPlayStoreTransaction: (purchaseToken: string) => Promise<void>;
    trackEvent: (eventName: string) => Promise<void>;
    setShortCode: (shortCode: string) => Promise<void>;
    setInsertAffiliateIdentifier: (referringLink: string) => Promise<void | string>;
    initialize: (code: string | null) => Promise<void>;
    isInitialized: boolean;
};
export declare const DeepLinkIapContext: React.Context<T_DEEPLINK_IAP_CONTEXT>;
declare const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER>;
export default DeepLinkIapProvider;
