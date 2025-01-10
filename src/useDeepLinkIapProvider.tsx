import { useContext } from "react";
import { DeepLinkIapContext } from "./DeepLinkIapProvider";

const useDeepLinkIapProvider = () => {
  const {
    // alreadyPurchased,
    // handleBuySubscription,
    // iapLoading,
    referrerLink,
    // isIapticValidated,
    // subscriptions,
    userId,
    // userPurchase,
    handlePurchaseValidation,
    trackEvent,
    setInsertAffiliateIdentifier,
    initialize,
    isInitialized
  } = useContext(DeepLinkIapContext);

  return {
    // alreadyPurchased,
    // handleBuySubscription,
    // iapLoading,
    referrerLink,
    // subscriptions,
    userId,
    handlePurchaseValidation,
    // isIapticValidated,
    // userPurchase,
    trackEvent,
    setInsertAffiliateIdentifier,
    initialize,
    isInitialized
  };
};

export default useDeepLinkIapProvider;
