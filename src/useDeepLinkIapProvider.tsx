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
    initialize
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
    initialize
  };
};

export default useDeepLinkIapProvider;
