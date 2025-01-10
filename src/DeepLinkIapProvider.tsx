import React, { createContext, useEffect, useState } from "react";
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

type CustomPurchase = {
  [key: string]: any; // Accept any fields
};

type T_DEEPLINK_IAP_CONTEXT = {
  referrerLink: string;
  userId: string;
  handlePurchaseValidation: (jsonIapPurchase: CustomPurchase) => Promise<boolean>;
  trackEvent: (eventName: string) => Promise<void>;
  setInsertAffiliateIdentifier: (
    referringLink: string,
    completion: (shortLink: string | null) => void
  ) => Promise<void>;
  initialize: (code: string | null) => Promise<void>;
  isInitialized: boolean;
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
  referrerLink: "",
  userId: "",
  handlePurchaseValidation: async (jsonIapPurchase: CustomPurchase) => false,
  trackEvent: async (eventName: string) => {},
  setInsertAffiliateIdentifier: async (
    referringLink: string,
    completion: (shortLink: string | null) => void
  ) => {},
  initialize: async (code: string | null) => {},
  isInitialized: false
});

const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER> = ({
  children,
  iapticAppId,
  iapticAppName,
  iapticPublicKey,
}) => {
  const [referrerLink, setReferrerLink] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const initialize = async (code: string | null): Promise<void> => {
    if (isInitialized) {
      console.error("[Insert Affiliate] SDK is already initialized.");
      return;
    }
  
    if (code && code.trim() !== "") {
      setCompanyCode(code);
      setIsInitialized(true);
      console.log(`[Insert Affiliate] SDK initialized with company code: ${code}`);
    } else {
      console.warn("[Insert Affiliate] SDK initialized without a company code.");
      setIsInitialized(true);
    }
  };  

  const reset = (): void => {
    setCompanyCode(null);
    setIsInitialized(false);
    console.log("[Insert Affiliate] SDK has been reset.");
  };

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
  
  // Helper function to determine if a link is a short code
  const isShortCode = (referringLink: string): boolean => {
    // Example check: short codes are less than 10 characters
    return referringLink.length < 10;
  };

  const setInsertAffiliateIdentifier = async (
    referringLink: string,
    completion: (shortLink: string | null) => void
  ) => {
    try {
      let userId = await getValueFromAsync(ASYNC_KEYS.USER_ID);
      if (!userId) {
        userId = generateUserID();
        await saveValueInAsync(ASYNC_KEYS.USER_ID, userId);
        setUserId(userId);
      }

      if (!referringLink) {
        console.warn("[Insert Affiliate] Referring link is invalid.");
        await saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, referringLink);
        completion(null);
        return;
      }
      
      if (!isInitialized || !companyCode) {
        console.error("[Insert Affiliate] SDK is not initialized. Please initialize the SDK with a valid company code.");
        completion(null);
        return;
      }
      
      if (!companyCode || companyCode.trim() === "") {
        console.error(
          "[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code."
        );
        completion(null);
        return;
      }
  
      // Check if referring link is already a short code, if so save it and stop here.
      if (isShortCode(referringLink)) {
        console.log("[Insert Affiliate] Referring link is already a short code.");
        await saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, referringLink);
        completion(referringLink);
        return;
      }
  
      // If the code is not already a short code, encode it raedy to send to our endpoint to return the short code. Save it before making the call in case something goes wrong
      // Encode the referring link
      const encodedAffiliateLink = encodeURIComponent(referringLink);
      if (!encodedAffiliateLink) {
        console.error("[Insert Affiliate] Failed to encode affiliate link.");
        await saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, referringLink);
        completion(null);
        return;
      }
  
      // Create the request URL
      const urlString = `http://api.insertaffiliate.com/V1/convert-deep-link-to-short-link?companyId=${companyCode}&deepLinkUrl=${encodedAffiliateLink}`;
      const response = await axios.get(urlString, {
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      // Call to the backend for the short code and save the resolse in valid
      if (response.status === 200 && response.data.shortLink) {
        const shortLink = response.data.shortLink;
        console.log("[Insert Affiliate] Short link received:", shortLink);
        await saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, shortLink);
        setReferrerLink(shortLink);
        completion(shortLink);
      } else {
        console.warn("[Insert Affiliate] Unexpected response format.");
        await saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, referringLink);
        completion(null);
      }
    } catch (error) {
      console.error("[Insert Affiliate] Error:", error);
      completion(null);
    }
  };

  const handlePurchaseValidation = async (jsonIapPurchase: CustomPurchase): Promise<boolean> => {
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
        return true;
      } else {
        console.error("Validation failed:", response.data);
        return false;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`handlePurchaseValidation Error: ${error.message}`);
      } else {
        console.error(`handlePurchaseValidation Unknown Error: ${JSON.stringify(error)}`);
      }

      return false;
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
        deepLinkParam: `${referrerLink}/${userId}`,
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

  return (
    <DeepLinkIapContext.Provider
      value={{
        referrerLink,
        userId,
        handlePurchaseValidation,
        trackEvent,
        setInsertAffiliateIdentifier,
        initialize,
        isInitialized
      }}
    >
      {children}
    </DeepLinkIapContext.Provider>
  );
};

export default DeepLinkIapProvider;
