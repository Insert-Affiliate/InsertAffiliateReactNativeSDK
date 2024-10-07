import { useContext } from "react";
import { BranchIapContext } from "./BranchIapProvider";

const useBranchIapProvider = () => {
  const {
    alreadyPurchased,
    handleBuySubscription,
    iapLoading,
    referrerLink,
    isIapticValidated,
    subscriptions,
    userId,
    userPurchase,
  } = useContext(BranchIapContext);

  return {
    alreadyPurchased,
    handleBuySubscription,
    iapLoading,
    referrerLink,
    subscriptions,
    userId,
    isIapticValidated,
    userPurchase,
  };
};

export default useBranchIapProvider;
