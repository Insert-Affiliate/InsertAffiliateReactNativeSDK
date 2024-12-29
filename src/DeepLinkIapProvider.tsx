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
import { Platform } from "react-native";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

// TYPES USED IN THIS PROVIDER
type T_DEEPLINK_IAP_PROVIDER = {
  children: React.ReactNode;
  iapSkus: string[];
  iapticAppId: string;
  iapticAppName: string;
  iapticPublicKey: string;
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
  trackEvent: (eventName: string) => Promise<void>;
};

type RequestBody = {
  id: string;
  type: string;
  transaction?: {
    id: string;
    type: string;
    appStoreReceipt?: string; // iOS-specific
    purchaseToken?: string; // Android-specific
    receipt?: string; // Android-specific
    signature?: string; // Android-specific
  };
  additionalData?: {
    applicationUsername: string;
  };
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
  trackEvent: async (eventName: string) => {},
});

const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER> = ({
  children,
  iapSkus,
  iapticAppId,
  iapticAppName,
  iapticPublicKey,
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
    console.log("Insert Affiliate - using local version!!")
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
      const baseRequestBody: RequestBody = {
        id: iapticAppId,
        type: "application",
      };
  
      let transaction;
  
      if (Platform.OS === "ios") {
        transaction = {
          id: iapticAppId,
          type: "ios-appstore",
          appStoreReceipt: jsonIapPurchase.transactionReceipt,
        };
      } else {
        const receiptJson = JSON.parse(atob(jsonIapPurchase.transactionReceipt || ""));
        transaction = {
          id: receiptJson.orderId, // Extracted orderId
          type: "android-playstore",
          purchaseToken: receiptJson.purchaseToken, // Extracted purchase token
          receipt: jsonIapPurchase.transactionReceipt, // Full receipt (Base64)
          signature: receiptJson.signature, // Receipt signature
        };
      }
  
      const requestBody = {
        ...baseRequestBody,
        transaction,
      };
  
      if (userId && referrerLink) {
        requestBody.additionalData = {
          applicationUsername: `${referrerLink}-${userId}`,
        };
      }
  
      // Send validation request to server
      const response = await axios({
        url: `https://validator.iaptic.com/v1/validate`,
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${iapticAppName}:${iapticPublicKey}`)}`,
          "Content-Type": "application/json",
        },
        data: requestBody,
      });
  
      if (response.status === 200) {
        console.log("Validation successful:", response.data);
        setIapticValidated(true);
      } else {
        console.error("Validation failed:", response.data);
        setIapticValidated(false);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`handlePurchaseValidation Error: ${error.message}`);
      } else {
        console.error(`handlePurchaseValidation Unknown Error: ${JSON.stringify(error)}`);
      }

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

          await saveValueInAsync(
            ASYNC_KEYS.USER_PURCHASE,
            JSON.stringify(currentPurchase)
          );
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

  const trackEvent = async (eventName: string): Promise<void> => {
    try {
      if (!referrerLink || !userId) {
        console.warn(
          "[Insert Affiliate] No affiliate identifier found. Please set one before tracking events."
        );
        return Promise.resolve();
      }

      const payload = {
        eventName,
        deepLinkParam: `${referrerLink}/${userId}`, // Similar to Swift SDK
      };

      const response = await axios.post(
        "https://api.insertaffiliate.com/v1/trackEvent",
        payload,
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.status === 200) {
        console.log("[Insert Affiliate] Event tracked successfully");
      } else {
        console.error(
          `[Insert Affiliate] Failed to track event with status code: ${response.status}`
        );
      }
    } catch (error) {
      console.error("[Insert Affiliate] Error tracking event:", error);
      return Promise.reject(error);
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
        trackEvent,
      }}
    >
      {children}
    </DeepLinkIapContext.Provider>
  );
};

export default withIAPContext(DeepLinkIapProvider);
