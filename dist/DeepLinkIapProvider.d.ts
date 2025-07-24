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
    OfferCode: string | null;
    returnInsertAffiliateIdentifier: () => Promise<string | null>;
    validatePurchaseWithIapticAPI: (jsonIapPurchase: CustomPurchase, iapticAppId: string, iapticAppName: string, iapticPublicKey: string) => Promise<boolean>;
    returnUserAccountTokenAndStoreExpectedTransaction: () => Promise<string | null>;
    storeExpectedStoreTransaction: (purchaseToken: string) => Promise<void>;
    trackEvent: (eventName: string) => Promise<void>;
    setShortCode: (shortCode: string) => Promise<void>;
    setInsertAffiliateIdentifier: (referringLink: string) => Promise<void | string>;
    initialize: (code: string | null, verboseLogging?: boolean) => Promise<void>;
    isInitialized: boolean;
};
export declare const DeepLinkIapContext: React.Context<T_DEEPLINK_IAP_CONTEXT>;
declare const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER>;
export default DeepLinkIapProvider;
