import { useContext } from "react";
import { DeepLinkIapContext } from "./DeepLinkIapProvider";

const useDeepLinkIapProvider = () => {
  const {
    alreadyPurchased,
    handleBuySubscription,
    iapLoading,
    referrerLink,
    isIapticValidated,
    subscriptions,
    userId,
    userPurchase,
    trackEvent,
    initialize,
    isInitialized
  } = useContext(DeepLinkIapContext);

  return {
    alreadyPurchased,
    handleBuySubscription,
    iapLoading,
    referrerLink,
    subscriptions,
    userId,
    isIapticValidated,
    userPurchase,
    trackEvent,
    initialize,
    isInitialized
  };
};

export default useDeepLinkIapProvider;
