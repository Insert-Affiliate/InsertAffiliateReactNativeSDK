import React, { createContext, useEffect, useState } from "react";
import {
  Purchase,
  Subscription,
  useIAP,
  requestSubscription,
  endConnection,
  withIAPContext,
} from "react-native-iap";
import { isPlay } from "react-native-iap/src/internal";
import branch from "react-native-branch";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// TYPES USED IN THIS PROVIDER
type T_DEEPLINK_IAP_PROVIDER = {
  children: React.ReactNode;
  iapSkus: string[];
  iapticAppId: string;
  iapticAppName: string;
  iapticAppSecret: string;
};

type T_DEEPLINK_IAP_CONTEXT = {
  iapLoading: boolean;
  alreadyPurchased: boolean;
  subscriptions: Subscription[];
  userPurchase: Purchase | null;
  referrerLink: string;
  userId: string;
  isIapticValidated: boolean | undefined;
  handleBuySubscription: (productId: string, offerToken?: string) => void;
};

const ASYNC_KEYS = {
  REFERRER_LINK: "@app_referrer_link",
  USER_PURCHASE: "@app_user_purchase",
  USER_ID: "@app_user_id",
};

// STARTING CONTEXT IMPLEMENTATION
export const DeepLinkIapContext = createContext<T_DEEPLINK_IAP_CONTEXT>({
  iapLoading: false,
  alreadyPurchased: false,
  isIapticValidated: undefined,
  subscriptions: [],
  userPurchase: null,
  referrerLink: "",
  userId: "",
  handleBuySubscription: (productId: string, offerToken?: string) => {},
});

const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER> = ({
  children,
  iapSkus,
  iapticAppId,
  iapticAppName,
  iapticAppSecret,
}) => {
  // LOCAL STATES
  const [iapLoading, setIapLoading] = useState<boolean>(false);
  const [alreadyPurchased, setAlreadyPurchased] = useState<boolean>(false);
  const [isIapticValidated, setIapticValidated] = useState<boolean | undefined>(
    undefined
  );
  const [userPurchase, setUserPurchase] = useState<Purchase | null>(null);
  const [referrerLink, setReferrerLink] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  const {
    connected,
    purchaseHistory,
    getPurchaseHistory,
    getSubscriptions,
    subscriptions,
    finishTransaction,
    currentPurchase,
    currentPurchaseError,
  } = useIAP();

  // ASYNC FUNCTIONS
  const saveValueInAsync = async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  };

  const getValueFromAsync = async (key: string) => {
    const response = await AsyncStorage.getItem(key);
    return response;
  };

  const clearAsyncStorage = async () => {
    await AsyncStorage.clear();
  };

  // EFFECT TO FETCH USER ID AND REF LINK
  // IF ALREADY EXISTS IN ASYNC STORAGE
  useEffect(() => {
    const fetchAsyncEssentials = async () => {
      try {
        const uId = await getValueFromAsync(ASYNC_KEYS.USER_ID);
        const refLink = await getValueFromAsync(ASYNC_KEYS.REFERRER_LINK);

        if (uId && refLink) {
          setUserId(uId);
          setReferrerLink(refLink);
        }
      } catch (error) {
        errorLog(`ERROR ~ fetchAsyncEssentials: ${error}`);
      }
    };

    fetchAsyncEssentials();
  }, []);

  //   FUNCTION TO SHOW LOG, ERROR and WARN
  const errorLog = (message: string, type?: "error" | "warn" | "log") => {
    switch (type) {
      case "error":
        console.error(`ENCOUNTER ERROR ~ ${message}`);
        break;
      case "warn":
        console.warn(`ENCOUNTER WARNING ~ ${message}`);
        break;
      default:
        console.log(`LOGGING ~ ${message}`);
        break;
    }
  };

  //   GENERATING UNIQUE USER ID
  const generateUserID = () => {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let uniqueId = "";
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uniqueId += characters[randomIndex];
    }
    return uniqueId;
  };

  //   BRANCH IMPLEMENTATION
  useEffect(() => {
    const branchSubscription = branch.subscribe(async ({ error, params }) => {
      if (error) {
        errorLog(`branchSubscription: ${JSON.stringify(error)}`, "error");
        return;
      } else if (!params) {
        errorLog(`branchSubscription: params does not exits`, "warn");
        return;
      } else if (!params["+clicked_branch_link"]) {
        errorLog(`branchSubscription: Not a branch link`, "warn");
        return;
      } else {
        if (params["~referring_link"]) {
          setReferrerLink(params["~referring_link"]);
          const userId = generateUserID();
          setUserId(userId);
          await saveValueInAsync(ASYNC_KEYS.USER_ID, userId);
          await saveValueInAsync(
            ASYNC_KEYS.REFERRER_LINK,
            params["~referring_link"]
          );
        } else
          errorLog(
            `branchSubscription: Params does't have referring_link`,
            "warn"
          );
      }
    });
    return () => {
      if (branchSubscription) {
        branchSubscription();
      }
    };
  }, []);

  //   IN APP PURCHASE IMPLEMENTATION STARTS

  /**
   * This function is responsisble to
   * fetch the subscriptions
   */
  const handleGetSubscriptions = async () => {
    try {
      await getSubscriptions({ skus: iapSkus });
    } catch (error) {
      errorLog(`handleGetSubscriptions: ${error}`, "error");
    }
  };

  /**
   * This function is responsible to
   * fetch the purchase history
   */
  const handleGetPurchaseHistory = async () => {
    try {
      await getPurchaseHistory();
      if (purchaseHistory.length > 0) {
        setAlreadyPurchased(true);
        setUserPurchase(currentPurchase ? currentPurchase : null);
      }
    } catch (error) {
      errorLog(`handleGetPurchaseHistory: ${error}`, "error");
    }
  };

  //   Effect to fetch IAP subscriptions + purchase history
  useEffect(() => {
    const fetchIapEssentials = async () => {
      try {
        await handleGetSubscriptions();
        await handleGetPurchaseHistory();
      } catch (error) {
        errorLog(`fetchIapEssentials: ${error}`);
      }
    };

    if (connected) fetchIapEssentials();
  }, [connected]);

  const handlePurchaseValidation = async (jsonIapPurchase: Purchase) => {
    try {
      if (!userId || !referrerLink) {
        errorLog(
          `WANR ~ handlePurchaseValidation: Continue without IAPTIC VALIDATION`
        );
        return;
      }

      await axios({
        url: `https://validator.iaptic.com/v1/validate`,
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(iapticAppName + ":" + iapticAppSecret)}`,
        },
        data: {
          id: iapticAppId,
          type: "application",
          transaction: {
            id: iapticAppId,
            type: "ios-appstore",
            appStoreReceipt: jsonIapPurchase.transactionReceipt,
          },
          additionalData: {
            applicationUsername: `${referrerLink}/${userId}`,
          },
        },
      });
      setIapticValidated(true);
    } catch (error) {
      errorLog(`handlePurchaseValidation: ${error}`, "error");
      setIapticValidated(false);
    }
  };

  useEffect(() => {
    const checkCurrentPurchase = async () => {
      try {
        if (currentPurchase?.productId) {
          setUserPurchase(currentPurchase);

          await handlePurchaseValidation(currentPurchase);

          await finishTransaction({
            purchase: currentPurchase,
            isConsumable: true,
          });

          await clearAsyncStorage();
          setUserId("");
          setReferrerLink("");
          setIapLoading(false);
        }
      } catch (error) {
        setIapLoading(false);
        errorLog(`checkCurrentPurchase: ${error}`, "error");
      }
    };

    checkCurrentPurchase();
  }, [currentPurchase, finishTransaction]);

  useEffect(() => {
    const checkCurrentPurchaseError = async () => {
      if (currentPurchaseError) {
        setIapLoading(false);
        errorLog(
          `checkCurrentPurchaseError: ${currentPurchaseError.message}`,
          "error"
        );
      }
    };
    checkCurrentPurchaseError();
  }, [currentPurchaseError]);

  /**
   * Function is responsible to
   * buy a subscription
   * @param {string} productId
   * @param {string} [offerToken]
   */
  const handleBuySubscription = async (
    productId: string,
    offerToken?: string
  ) => {
    if (isPlay && !offerToken) {
      console.warn(
        `There are no subscription Offers for selected product (Only requiered for Google Play purchases): ${productId}`
      );
    }
    try {
      setIapLoading(true);
      await requestSubscription({
        sku: productId,
        ...(offerToken && {
          subscriptionOffers: [{ sku: productId, offerToken }],
        }),
      });
    } catch (error) {
      setIapLoading(false);
      errorLog(`handleBuySubscription: ${error}`, "error");
    }
  };

  useEffect(() => {
    return () => {
      endConnection();
    };
  }, []);

  return (
    <DeepLinkIapContext.Provider
      value={{
        iapLoading,
        alreadyPurchased,
        isIapticValidated,
        subscriptions,
        userPurchase,
        referrerLink,
        userId,
        handleBuySubscription,
      }}
    >
      {children}
    </DeepLinkIapContext.Provider>
  );
};

export default withIAPContext(DeepLinkIapProvider);
