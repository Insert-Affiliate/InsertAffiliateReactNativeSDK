import { useContext } from "react";
import { DeepLinkIapContext } from "./DeepLinkIapProvider";

const useDeepLinkIapProvider = () => {
  const {
    referrerLink,
    userId,
    handlePurchaseValidation,
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
    trackEvent,
    setShortCode,
    setInsertAffiliateIdentifier,
    initialize,
    isInitialized
  };
};

export default useDeepLinkIapProvider;
