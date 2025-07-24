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
    trackEvent,
    setShortCode,
    setInsertAffiliateIdentifier,
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
    trackEvent,
    setShortCode,
    setInsertAffiliateIdentifier,
    initialize,
    isInitialized,
    OfferCode,
  };
};

export default useDeepLinkIapProvider;
