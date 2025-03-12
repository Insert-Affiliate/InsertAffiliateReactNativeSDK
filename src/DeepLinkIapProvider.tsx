import React, { createContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TYPES USED IN THIS PROVIDER
type T_DEEPLINK_IAP_PROVIDER = {
  children: React.ReactNode;
};

type CustomPurchase = {
  [key: string]: any; // Accept any fields to allow it to work wtih multiple IAP libraries
};

type T_DEEPLINK_IAP_CONTEXT = {
  referrerLink: string;
  userId: string;
  returnInsertAffiliateIdentifier: () => Promise<string | null>;
  validatePurchaseWithIapticAPI: (
    jsonIapPurchase: CustomPurchase,
    iapticAppId: string,
    iapticAppName: string,
    iapticPublicKey: string
  ) => Promise<boolean>;
  returnUserAccountTokenAndStoreExpectedTransaction: () => Promise<string | null>;
  storeExpectedStoreTransaction: (
    purchaseToken: string
  ) => Promise<void>;
  trackEvent: (eventName: string) => Promise<void>;
  setShortCode: (shortCode: string) => Promise<void>;
  setInsertAffiliateIdentifier: (
    referringLink: string
  ) => Promise<void | string>;
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
  REFERRER_LINK: '@app_referrer_link',
  USER_PURCHASE: '@app_user_purchase',
  USER_ID: '@app_user_id',
  COMPANY_CODE: '@app_company_code',
  USER_ACCOUNT_TOKEN: '@app_user_account_token',
};

// STARTING CONTEXT IMPLEMENTATION
export const DeepLinkIapContext = createContext<T_DEEPLINK_IAP_CONTEXT>({
  referrerLink: '',
  userId: '',
  returnInsertAffiliateIdentifier: async () => '',
  validatePurchaseWithIapticAPI: async (
    jsonIapPurchase: CustomPurchase,
    iapticAppId: string,
    iapticAppName: string,
    iapticPublicKey: string
  ) => false,
  returnUserAccountTokenAndStoreExpectedTransaction: async () => '',
  storeExpectedStoreTransaction: async (purchaseToken: string) => {},
  trackEvent: async (eventName: string) => {},
  setShortCode: async (shortCode: string) => {},
  setInsertAffiliateIdentifier: async (referringLink: string) => {},
  initialize: async (code: string | null) => {},
  isInitialized: false,
});

const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER> = ({
  children,
}) => {
  const [referrerLink, setReferrerLink] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // MARK: Initialize the SDK
  const initialize = async (companyCode: string | null): Promise<void> => {
    if (isInitialized) {
      console.error('[Insert Affiliate] SDK is already initialized.');
      return;
    }

    if (companyCode && companyCode.trim() !== '') {
      setCompanyCode(companyCode);
      await saveValueInAsync(ASYNC_KEYS.COMPANY_CODE, companyCode);
      setIsInitialized(true);
      console.log(
        `[Insert Affiliate] SDK initialized with company code: ${companyCode}`
      );
    } else {
      console.warn(
        '[Insert Affiliate] SDK initialized without a company code.'
      );
      setIsInitialized(true);
    }
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

  async function generateThenSetUserID() {
    let userId = await getValueFromAsync(ASYNC_KEYS.USER_ID);
    if (!userId) {
      userId = generateUserID();
      setUserId(userId);
      await saveValueInAsync(ASYNC_KEYS.USER_ID, userId);
    } else {
      setUserId(userId);
    }

    return userId;
  }

  const generateUserID = () => {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let uniqueId = '';
    for (let i = 0; i < 6; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      uniqueId += characters[randomIndex];
    }
    return uniqueId;
  };

  const reset = (): void => {
    setCompanyCode(null);
    setIsInitialized(false);
    console.log('[Insert Affiliate] SDK has been reset.');
  };

  // Helper funciton Storage / Retrieval
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

  // Helper function to log errors
  const errorLog = (message: string, type?: 'error' | 'warn' | 'log') => {
    switch (type) {
      case 'error':
        console.error(`ENCOUNTER ERROR ~ ${message}`);
        break;
      case 'warn':
        console.warn(`ENCOUNTER WARNING ~ ${message}`);
        break;
      default:
        console.log(`LOGGING ~ ${message}`);
        break;
    }
  };

  // MARK: Short Codes
  const isShortCode = (referringLink: string): boolean => {
    // Short codes are less than 10 characters
    const isValidCharacters = /^[a-zA-Z0-9]+$/.test(referringLink);
    return isValidCharacters && referringLink.length < 10;
  };

  async function setShortCode(shortCode: string): Promise<void> {
    console.log('[Insert Affiliate] Setting short code.');
    await generateThenSetUserID();

    // Validate it is a short code
    const capitalisedShortCode = shortCode.toUpperCase();
    isShortCode(capitalisedShortCode);

    // If all checks pass, set the Insert Affiliate Identifier
    await storeInsertAffiliateIdentifier({ link: capitalisedShortCode });
  }

  async function getOrCreateUserAccountToken(): Promise<string> {
    let userAccountToken = await getValueFromAsync(ASYNC_KEYS.USER_ACCOUNT_TOKEN);

    if (!userAccountToken) {
      userAccountToken = UUID();
      await saveValueInAsync(ASYNC_KEYS.USER_ACCOUNT_TOKEN, userAccountToken);
    }

    return userAccountToken;
  };

  const returnUserAccountTokenAndStoreExpectedTransaction = async (): Promise<string | null> => {
    try {
      const shortCode = await returnInsertAffiliateIdentifier();
      if (!shortCode) {
        console.log('[Insert Affiliate] No affiliate stored - not saving expected transaction.');
        return null;
      }

      const userAccountToken = await getOrCreateUserAccountToken();
      console.log('[Insert Affiliate] User account token:', userAccountToken);

      if (!userAccountToken) {
        console.error('[Insert Affiliate] Failed to generate user account token.');
        return null;
      } else {
        await storeExpectedStoreTransaction(userAccountToken);
        return userAccountToken;
      }
    } catch (error) {
      console.error('[Insert Affiliate] Error in returnUserAccountTokenAndStoreExpectedTransaction:', error);
      return null;
    };
  };

  // MARK: Return Insert Affiliate Identifier
  const returnInsertAffiliateIdentifier = async (): Promise<string | null> => {
    try {
      return `${referrerLink}-${userId}`;
    } catch (error) {
      errorLog(`ERROR ~ returnInsertAffiliateIdentifier: ${error}`);
      return null;
    }
  };

  // MARK: Insert Affiliate Identifier

  async function setInsertAffiliateIdentifier(
    referringLink: string
  ): Promise<void | string> {
    console.log('[Insert Affiliate] Setting affiliate identifier.');

    try {
      const customerID = await generateThenSetUserID();
      console.log(
        '[Insert Affiliate] Completed generateThenSetUserID within setInsertAffiliateIdentifier.'
      );

      if (!referringLink) {
        console.warn('[Insert Affiliate] Referring link is invalid.');
        let heldReferrerLinkBeforeAsyncStateUpdate = referrerLink;
        await storeInsertAffiliateIdentifier({ link: referringLink });
        return `${heldReferrerLinkBeforeAsyncStateUpdate}-${customerID}`;
      }

      if (!companyCode || (companyCode.trim() === '' && companyCode !== null)) {
        let companyCodeFromStorage = await getValueFromAsync(
          ASYNC_KEYS.COMPANY_CODE
        );

        if (companyCodeFromStorage !== null) {
          setCompanyCode(companyCodeFromStorage);
        } else {
          console.error(
            '[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.'
          );
          return;
        }
      }

      // Check if referring link is already a short code, if so save it and stop here.
      if (isShortCode(referringLink)) {
        console.log(
          '[Insert Affiliate] Referring link is already a short code.'
        );
        let heldReferrerLinkBeforeAsyncStateUpdate = referrerLink;
        await storeInsertAffiliateIdentifier({ link: referringLink });
        return `${heldReferrerLinkBeforeAsyncStateUpdate}-${customerID}`;
      }

      // If the code is not already a short code, encode it raedy to send to our endpoint to return the short code. Save it before making the call in case something goes wrong
      // Encode the referring link
      const encodedAffiliateLink = encodeURIComponent(referringLink);
      if (!encodedAffiliateLink) {
        console.error('[Insert Affiliate] Failed to encode affiliate link.');

        let heldReferrerLinkBeforeAsyncStateUpdate = referrerLink;
        await storeInsertAffiliateIdentifier({ link: referringLink });
        return `${heldReferrerLinkBeforeAsyncStateUpdate}-${customerID}`;
      }

      // Create the request URL
      const urlString = `https://api.insertaffiliate.com/V1/convert-deep-link-to-short-link?companyId=${companyCode}&deepLinkUrl=${encodedAffiliateLink}`;
      console.log('[Insert Affiliate] urlString .', urlString);
      const response = await axios.get(urlString, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Call to the backend for the short code and save the resolse in valid
      if (response.status === 200 && response.data.shortLink) {
        const shortLink = response.data.shortLink;
        console.log('[Insert Affiliate] Short link received:', shortLink);
        return `${shortLink}-${customerID}`;
      } else {
        console.warn('[Insert Affiliate] Unexpected response format.');
        let heldReferrerLinkBeforeAsyncStateUpdate = referrerLink;
        await storeInsertAffiliateIdentifier({ link: referringLink });
        return `${heldReferrerLinkBeforeAsyncStateUpdate}-${customerID}`;
      }
    } catch (error) {
      console.error('[Insert Affiliate] Error:', error);
    }
  };
  
  async function storeInsertAffiliateIdentifier({ link }: { link: string }) {
    console.log(`[Insert Affiliate] Storing affiliate identifier: ${link}`);
    setReferrerLink(link);
    await saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, link);
  }

  const validatePurchaseWithIapticAPI = async (
    jsonIapPurchase: CustomPurchase,
    iapticAppId: string,
    iapticAppName: string,
    iapticPublicKey: string
  ): Promise<boolean> => {
    try {
      const baseRequestBody: RequestBody = {
        id: iapticAppId,
        type: 'application',
      };

      let transaction;

      if (Platform.OS === 'ios') {
        transaction = {
          id: iapticAppId,
          type: 'ios-appstore',
          appStoreReceipt: jsonIapPurchase.transactionReceipt,
        };
      } else {
        const receiptJson = JSON.parse(
          atob(jsonIapPurchase.transactionReceipt || '')
        );
        transaction = {
          id: receiptJson.orderId, // Extracted orderId
          type: 'android-playstore',
          purchaseToken: receiptJson.purchaseToken, // Extracted purchase token
          receipt: jsonIapPurchase.transactionReceipt, // Full receipt (Base64)
          signature: receiptJson.signature, // Receipt signature
        };
      }

      const requestBody = {
        ...baseRequestBody,
        transaction,
      };

      let insertAffiliateIdentifier = await returnInsertAffiliateIdentifier();

      if (insertAffiliateIdentifier) {
        requestBody.additionalData = {
          applicationUsername: `${insertAffiliateIdentifier}`,
        };
      }

      // Send validation request to server
      const response = await axios({
        url: `https://validator.iaptic.com/v1/validate`,
        method: 'POST',
        headers: {
          Authorization: `Basic ${btoa(`${iapticAppName}:${iapticPublicKey}`)}`,
          'Content-Type': 'application/json',
        },
        data: requestBody,
      });

      if (response.status === 200) {
        console.log('Validation successful:', response.data);
        return true;
      } else {
        console.error('Validation failed:', response.data);
        return false;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`validatePurchaseWithIapticAPI Error: ${error.message}`);
      } else {
        console.error(
          `validatePurchaseWithIapticAPI Unknown Error: ${JSON.stringify(
            error
          )}`
        );
      }

      return false;
    }
  };

  const storeExpectedStoreTransaction = async (purchaseToken: string): Promise<void> => {
    if (!companyCode || (companyCode.trim() === '' && companyCode !== null)) {
      console.error("[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.");
      return;
    }

    const shortCode = await returnInsertAffiliateIdentifier();
    if (!shortCode) {
      console.error("[Insert Affiliate] No affiliate identifier found. Please set one before tracking events.");
      return;
    }

    // Build JSON payload
    const payload = {
      UUID: purchaseToken,
      companyCode,
      shortCode,
      storedDate: new Date().toISOString(), // ISO8601 format
    };

    console.log("[Insert Affiliate] Storing expected transaction: ", payload);

    try {
      const response = await fetch("https://api.insertaffiliate.com/v1/api/app-store-webhook/create-expected-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.info("[Insert Affiliate] Expected transaction stored successfully.");
      } else {
        const errorText = await response.text();
        console.error(`[Insert Affiliate] Failed to store expected transaction with status code: ${response.status}. Response: ${errorText}`);
      }
    } catch (error) {
      console.error(`[Insert Affiliate] Error storing expected transaction: ${error}`);
    }
  };

  // MARK: Track Event
  const trackEvent = async (eventName: string): Promise<void> => {
    try {
      if (!referrerLink || !userId) {
        console.warn(
          '[Insert Affiliate] No affiliate identifier found. Please set one before tracking events.'
        );
        return Promise.resolve();
      }

      const payload = {
        eventName,
        deepLinkParam: `${referrerLink}/${userId}`,
      };

      const response = await axios.post(
        'https://api.insertaffiliate.com/v1/trackEvent',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.status === 200) {
        console.log('[Insert Affiliate] Event tracked successfully');
      } else {
        console.error(
          `[Insert Affiliate] Failed to track event with status code: ${response.status}`
        );
      }
    } catch (error) {
      console.error('[Insert Affiliate] Error tracking event:', error);
      return Promise.reject(error);
    }
  };

  return (
    <DeepLinkIapContext.Provider
      value={{
        referrerLink,
        userId,
        setShortCode,
        returnInsertAffiliateIdentifier,
        storeExpectedStoreTransaction,
        returnUserAccountTokenAndStoreExpectedTransaction,
        validatePurchaseWithIapticAPI,
        trackEvent,
        setInsertAffiliateIdentifier,
        initialize,
        isInitialized,
      }}
    >
      {children}
    </DeepLinkIapContext.Provider>
  );
};

export default DeepLinkIapProvider;
  function UUID(): string {
    // Generate a random UUID (version 4)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0,
        v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

