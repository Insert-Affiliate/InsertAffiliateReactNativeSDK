"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const DeepLinkIapProvider_1 = require("./DeepLinkIapProvider");
const useDeepLinkIapProvider = () => {
    const { referrerLink, userId, validatePurchaseWithIapticAPI, storeExpectedStoreTransaction, returnUserAccountTokenAndStoreExpectedTransaction, returnInsertAffiliateIdentifier, trackEvent, setShortCode, setInsertAffiliateIdentifier, initialize, isInitialized, fetchAndConditionallyOpenUrl } = (0, react_1.useContext)(DeepLinkIapProvider_1.DeepLinkIapContext);
    return {
        referrerLink,
        userId,
        validatePurchaseWithIapticAPI,
        storeExpectedStoreTransaction,
        returnUserAccountTokenAndStoreExpectedTransaction,
        returnInsertAffiliateIdentifier,
        trackEvent,
        setShortCode,
        setInsertAffiliateIdentifier,
        initialize,
        isInitialized,
        fetchAndConditionallyOpenUrl
    };
};
exports.default = useDeepLinkIapProvider;
