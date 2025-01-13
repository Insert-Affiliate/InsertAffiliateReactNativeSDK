import { useContext } from "react";
import { DeepLinkIapContext } from "./DeepLinkIapProvider";

const useDeepLinkIapProvider = () => {
  const {
    referrerLink,
    userId,
    handlePurchaseValidation,
    returnInsertAffiliateIdentifier,
    trackEvent,
    setShortCode,
    setInsertAffiliateIdentifier,
    initialize,
    isInitialized
  } = useContext(DeepLinkIapContext);

  return {
    referrerLink,
    userId,
    handlePurchaseValidation,
    returnInsertAffiliateIdentifier,
    trackEvent,
    setShortCode,
    setInsertAffiliateIdentifier,
    initialize,
    isInitialized
  };
};

export default useDeepLinkIapProvider;
