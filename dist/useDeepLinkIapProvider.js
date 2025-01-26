"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const DeepLinkIapProvider_1 = require("./DeepLinkIapProvider");
const useDeepLinkIapProvider = () => {
    const { referrerLink, userId, validatePurchaseWithIapticAPI, returnInsertAffiliateIdentifier, trackEvent, setShortCode, setInsertAffiliateIdentifier, initialize, isInitialized } = (0, react_1.useContext)(DeepLinkIapProvider_1.DeepLinkIapContext);
    return {
        referrerLink,
        userId,
        validatePurchaseWithIapticAPI,
        returnInsertAffiliateIdentifier,
        trackEvent,
        setShortCode,
        setInsertAffiliateIdentifier,
        initialize,
        isInitialized
    };
};
exports.default = useDeepLinkIapProvider;
