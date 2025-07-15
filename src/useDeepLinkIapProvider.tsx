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
    fetchAndConditionallyOpenUrl
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
    fetchAndConditionallyOpenUrl
  };
};

export default useDeepLinkIapProvider;
