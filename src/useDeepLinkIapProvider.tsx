import { useContext } from "react";
import { DeepLinkIapContext } from "./DeepLinkIapProvider";

const useDeepLinkIapProvider = () => {
  const {
    referrerLink,
    userId,
    validatePurchaseWithIapticAPI,
    storeExpectedStoreTransaction,
    returnUserAccountTokenAndStoreExpectedTransaction,
    returnInsertAffiliateIdentifier,
    isAffiliateAttributionValid,
    getAffiliateStoredDate,
    trackEvent,
    setShortCode,
    setInsertAffiliateIdentifier,
    setInsertAffiliateIdentifierChangeCallback,
    handleInsertLinks,
    initialize,
    isInitialized,
    OfferCode,
  } = useContext(DeepLinkIapContext);

  return {
    referrerLink,
    userId,
    validatePurchaseWithIapticAPI,
    storeExpectedStoreTransaction,
    returnUserAccountTokenAndStoreExpectedTransaction,
    returnInsertAffiliateIdentifier,
    isAffiliateAttributionValid,
    getAffiliateStoredDate,
    trackEvent,
    setShortCode,
    setInsertAffiliateIdentifier,
    setInsertAffiliateIdentifierChangeCallback,
    handleInsertLinks,
    initialize,
    isInitialized,
    OfferCode,
  };
};

export default useDeepLinkIapProvider;
