"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const DeepLinkIapProvider_1 = require("./DeepLinkIapProvider");
const useDeepLinkIapProvider = () => {
    const { referrerLink, userId, validatePurchaseWithIapticAPI, storeExpectedStoreTransaction, returnUserAccountTokenAndStoreExpectedTransaction, returnInsertAffiliateIdentifier, isAffiliateAttributionValid, getAffiliateStoredDate, getAffiliateExpiryTimestamp, trackEvent, setShortCode, getAffiliateDetails, getAffiliateLookupResult, setInsertAffiliateIdentifier, setInsertAffiliateIdentifierChangeCallback, handleInsertLinks, initialize, setLogger, isInitialized, OfferCode, createAffiliateForUser, verifyAffiliateCode, getMyAffiliateDetails, isUserAnAffiliate, signOutAffiliate, getReferralProgramConfig, shareReferralLink, } = (0, react_1.useContext)(DeepLinkIapProvider_1.DeepLinkIapContext);
    return {
        referrerLink,
        userId,
        validatePurchaseWithIapticAPI,
        storeExpectedStoreTransaction,
        returnUserAccountTokenAndStoreExpectedTransaction,
        returnInsertAffiliateIdentifier,
        isAffiliateAttributionValid,
        getAffiliateStoredDate,
        getAffiliateExpiryTimestamp,
        trackEvent,
        setShortCode,
        getAffiliateDetails,
        getAffiliateLookupResult,
        setInsertAffiliateIdentifier,
        setInsertAffiliateIdentifierChangeCallback,
        handleInsertLinks,
        initialize,
        setLogger,
        isInitialized,
        OfferCode,
        createAffiliateForUser,
        verifyAffiliateCode,
        getMyAffiliateDetails,
        isUserAnAffiliate,
        signOutAffiliate,
        getReferralProgramConfig,
        shareReferralLink,
    };
};
exports.default = useDeepLinkIapProvider;
