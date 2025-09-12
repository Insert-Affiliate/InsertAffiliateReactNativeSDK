import React, { createContext, useEffect, useState, useRef } from 'react';
import { Platform, Linking } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TYPES USED IN THIS PROVIDER
type T_DEEPLINK_IAP_PROVIDER = {
  children: React.ReactNode;
};

export type InsertAffiliateIdentifierChangeCallback = (identifier: string | null) => void;

type CustomPurchase = {
  [key: string]: any; // Accept any fields to allow it to work wtih multiple IAP libraries
};

type T_DEEPLINK_IAP_CONTEXT = {
  referrerLink: string;
  userId: string;
  OfferCode: string | null;
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
  setInsertAffiliateIdentifierChangeCallback: (callback: InsertAffiliateIdentifierChangeCallback | null) => void;
  handleInsertLinks: (url: string) => Promise<boolean>;
  initialize: (code: string | null, verboseLogging?: boolean, insertLinksEnabled?: boolean, insertLinksClipboardEnabled?: boolean) => Promise<void>;
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
  IOS_OFFER_CODE: '@app_ios_offer_code',
};

// STARTING CONTEXT IMPLEMENTATION
export const DeepLinkIapContext = createContext<T_DEEPLINK_IAP_CONTEXT>({
  referrerLink: '',
  userId: '',
  OfferCode: null,
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
  setInsertAffiliateIdentifierChangeCallback: (callback: InsertAffiliateIdentifierChangeCallback | null) => {},
  handleInsertLinks: async (url: string) => false,
  initialize: async (code: string | null, verboseLogging?: boolean, insertLinksEnabled?: boolean, insertLinksClipboardEnabled?: boolean) => {},
  isInitialized: false,
});

const DeepLinkIapProvider: React.FC<T_DEEPLINK_IAP_PROVIDER> = ({
  children,
}) => {
  const [referrerLink, setReferrerLink] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [companyCode, setCompanyCode] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [verboseLogging, setVerboseLogging] = useState<boolean>(false);
  const [insertLinksEnabled, setInsertLinksEnabled] = useState<boolean>(false);
  const [OfferCode, setOfferCode] = useState<string | null>(null);
  const insertAffiliateIdentifierChangeCallbackRef = useRef<InsertAffiliateIdentifierChangeCallback | null>(null);

  // MARK: Initialize the SDK
  const initialize = async (companyCode: string | null, verboseLogging: boolean = false, insertLinksEnabled: boolean = false, insertLinksClipboardEnabled: boolean = false): Promise<void> => {
    setVerboseLogging(verboseLogging);
    setInsertLinksEnabled(insertLinksEnabled);
    
    if (verboseLogging) {
      console.log('[Insert Affiliate] [VERBOSE] Starting SDK initialization...');
      console.log('[Insert Affiliate] [VERBOSE] Company code provided:', companyCode ? 'Yes' : 'No');
      console.log('[Insert Affiliate] [VERBOSE] Verbose logging enabled');
    }

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
      if (verboseLogging) {
        console.log('[Insert Affiliate] [VERBOSE] Company code saved to AsyncStorage');
        console.log('[Insert Affiliate] [VERBOSE] SDK marked as initialized');
      }
    } else {
      console.warn(
        '[Insert Affiliate] SDK initialized without a company code.'
      );
      setIsInitialized(true);
      if (verboseLogging) {
        console.log('[Insert Affiliate] [VERBOSE] No company code provided, SDK initialized in limited mode');
      }
    }
  };

  // EFFECT TO FETCH USER ID AND REF LINK
  // IF ALREADY EXISTS IN ASYNC STORAGE
  useEffect(() => {
    const fetchAsyncEssentials = async () => {
      try {
        verboseLog('Loading stored data from AsyncStorage...');
        const uId = await getValueFromAsync(ASYNC_KEYS.USER_ID);
        const refLink = await getValueFromAsync(ASYNC_KEYS.REFERRER_LINK);
        const companyCodeFromStorage = await getValueFromAsync(ASYNC_KEYS.COMPANY_CODE);
        const storedOfferCode = await getValueFromAsync(ASYNC_KEYS.IOS_OFFER_CODE);

        verboseLog(`User ID found: ${uId ? 'Yes' : 'No'}`);
        verboseLog(`Referrer link found: ${refLink ? 'Yes' : 'No'}`);
        verboseLog(`Company code found: ${companyCodeFromStorage ? 'Yes' : 'No'}`);
        verboseLog(`iOS Offer Code found: ${storedOfferCode ? 'Yes' : 'No'}`);

        if (uId && refLink) {
          setUserId(uId);
          setReferrerLink(refLink);
          verboseLog('User ID and referrer link restored from storage');
        }

        if (companyCodeFromStorage) {
          setCompanyCode(companyCodeFromStorage);
          verboseLog('Company code restored from storage');
        }

        if (storedOfferCode) {
          setOfferCode(storedOfferCode);
          verboseLog('iOS Offer Code restored from storage');
        }
      } catch (error) {
        errorLog(`ERROR ~ fetchAsyncEssentials: ${error}`);
        verboseLog(`Error loading from AsyncStorage: ${error}`);
      }
    };

    fetchAsyncEssentials();
  }, []);

  // Cleanup callback on unmount
  useEffect(() => {
    return () => {
      insertAffiliateIdentifierChangeCallbackRef.current = null;
    };
  }, []);

  // Deep link event listeners - equivalent to iOS AppDelegate methods
  useEffect(() => {
    if (!isInitialized) return;

    // Handle app launch with URL (equivalent to didFinishLaunchingWithOptions)
    const handleInitialURL = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          verboseLog(`App launched with URL: ${initialUrl}`);
          const handled = await handleInsertLinks(initialUrl);
          if (handled) {
            verboseLog('URL was handled by Insert Affiliate SDK');
          } else {
            verboseLog('URL was not handled by Insert Affiliate SDK');
          }
        }
      } catch (error) {
        console.error('[Insert Affiliate] Error getting initial URL:', error);
      }
    };

    // Handle URL opening while app is running (equivalent to open url)
    const handleUrlChange = async (event: { url: string }) => {
      try {
        verboseLog(`URL opened while app running: ${event.url}`);
        const handled = await handleInsertLinks(event.url);
        if (handled) {
          verboseLog('URL was handled by Insert Affiliate SDK');
        } else {
          verboseLog('URL was not handled by Insert Affiliate SDK');
        }
      } catch (error) {
        console.error('[Insert Affiliate] Error handling URL change:', error);
      }
    };

    // Set up listeners
    const urlListener = Linking.addEventListener('url', handleUrlChange);
    
    // Handle initial URL
    handleInitialURL();

    // Cleanup
    return () => {
      urlListener?.remove();
    };
  }, [isInitialized]);

  async function generateThenSetUserID() {
    verboseLog('Getting or generating user ID...');
    let userId = await getValueFromAsync(ASYNC_KEYS.USER_ID);
    
    if (!userId) {
      verboseLog('No existing user ID found, generating new one...');
      userId = generateUserID();
      setUserId(userId);
      await saveValueInAsync(ASYNC_KEYS.USER_ID, userId);
      verboseLog(`Generated and saved new user ID: ${userId}`);
    } else {
      verboseLog(`Found existing user ID: ${userId}`);
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

  // MARK: Callback Management
  // Sets a callback that will be triggered whenever storeInsertAffiliateIdentifier is called
  // The callback receives the current affiliate identifier (returnInsertAffiliateIdentifier result)
  const setInsertAffiliateIdentifierChangeCallbackHandler = (callback: InsertAffiliateIdentifierChangeCallback | null): void => {
    insertAffiliateIdentifierChangeCallbackRef.current = callback;
  };

  // MARK: Deep Link Handling
  // Helper function to parse URLs in React Native compatible way
  const parseURL = (url: string) => {
    try {
      // Extract protocol
      const protocolMatch = url.match(/^([^:]+):/);
      const protocol = protocolMatch ? protocolMatch[1] + ':' : '';
      
      // Extract hostname for https URLs
      let hostname = '';
      if (protocol === 'https:' || protocol === 'http:') {
        const hostnameMatch = url.match(/^https?:\/\/([^\/]+)/);
        hostname = hostnameMatch ? hostnameMatch[1] : '';
      }
      
      return {
        protocol,
        hostname,
        href: url
      };
    } catch (error) {
      return {
        protocol: '',
        hostname: '',
        href: url
      };
    }
  };

  // Handles Insert Links deep linking - equivalent to iOS handleInsertLinks
  const handleInsertLinks = async (url: string): Promise<boolean> => {
    try {
      console.log(`[Insert Affiliate] Attempting to handle URL: ${url}`);
      
      if (!url || typeof url !== 'string') {
        console.log('[Insert Affiliate] Invalid URL provided to handleInsertLinks');
        return false;
      }

      // Check if deep links are enabled synchronously
      if (!insertLinksEnabled) {
        console.log('[Insert Affiliate] Deep links are disabled, not handling URL');
        return false;
      }

      const urlObj = parseURL(url);

      // Handle custom URL schemes (ia-companycode://shortcode)
      if (urlObj.protocol && urlObj.protocol.startsWith('ia-')) {
        return await handleCustomURLScheme(url, urlObj.protocol);
      }

      // Handle universal links (https://insertaffiliate.link/V1/companycode/shortcode)
      // if (urlObj.protocol === 'https:' && urlObj.hostname?.includes('insertaffiliate.link')) {
      //   return await handleUniversalLink(urlObj);
      // }

      return false;
    } catch (error) {
      console.error('[Insert Affiliate] Error handling Insert Link:', error);
      verboseLog(`Error in handleInsertLinks: ${error}`);
      return false;
    }
  };

  // Handle custom URL schemes like ia-companycode://shortcode
  const handleCustomURLScheme = async (url: string, protocol: string): Promise<boolean> => {
    try {
      const scheme = protocol.replace(':', '');
      
      if (!scheme.startsWith('ia-')) {
        return false;
      }

      // Extract company code from scheme (remove "ia-" prefix)
      const companyCode = scheme.substring(3);
      
      const shortCode = parseShortCodeFromURLString(url);
      if (!shortCode) {
        console.log(`[Insert Affiliate] Failed to parse short code from deep link: ${url}`);
        return false;
      }

      console.log(`[Insert Affiliate] Custom URL scheme detected - Company: ${companyCode}, Short code: ${shortCode}`);

      // Validate company code matches initialized one
      const activeCompanyCode = await getActiveCompanyCode();
      if (activeCompanyCode && companyCode.toLowerCase() !== activeCompanyCode.toLowerCase()) {
        console.log(`[Insert Affiliate] Warning: URL company code (${companyCode}) doesn't match initialized company code (${activeCompanyCode})`);
      }

      // If URL scheme is used, we can straight away store the short code as the referring link
      await storeInsertAffiliateIdentifier({ link: shortCode });

      return true;
    } catch (error) {
      console.error('[Insert Affiliate] Error handling custom URL scheme:', error);
      return false;
    }
  };

  // Handle universal links like https://insertaffiliate.link/V1/companycode/shortcode
  // const handleUniversalLink = async (url: URL): Promise<boolean> => {
  //   try {
  //     const pathComponents = url.pathname.split('/').filter(segment => segment.length > 0);
      
  //     // Expected format: /V1/companycode/shortcode
  //     if (pathComponents.length < 3 || pathComponents[0] !== 'V1') {
  //       console.log(`[Insert Affiliate] Invalid universal link format: ${url.href}`);
  //       return false;
  //     }

  //     const companyCode = pathComponents[1];
  //     const shortCode = pathComponents[2];

  //     console.log(`[Insert Affiliate] Universal link detected - Company: ${companyCode}, Short code: ${shortCode}`);

  //     // Validate company code matches initialized one
  //     const activeCompanyCode = await getActiveCompanyCode();
  //     if (activeCompanyCode && companyCode.toLowerCase() !== activeCompanyCode.toLowerCase()) {
  //       console.log(`[Insert Affiliate] Warning: URL company code (${companyCode}) doesn't match initialized company code (${activeCompanyCode})`);
  //     }

  //     // Process the affiliate attribution
  //     await storeInsertAffiliateIdentifier({ link: shortCode });


  //     return true;
  //   } catch (error) {
  //     console.error('[Insert Affiliate] Error handling universal link:', error);
  //     return false;
  //   }
  // };

  // Parse short code from URL
  const parseShortCodeFromURL = (url: URL): string | null => {
    try {
      // For custom schemes like ia-companycode://shortcode, everything after :// is the short code
      // Remove leading slash from pathname
      return url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    } catch (error) {
      verboseLog(`Error parsing short code from URL: ${error}`);
      return null;
    }
  };

  const parseShortCodeFromURLString = (url: string): string | null => {
    try {
      // For custom schemes like ia-companycode://shortcode, everything after :// is the short code
      const match = url.match(/^[^:]+:\/\/(.+)$/);
      if (match) {
        const shortCode = match[1];
        // Remove leading slash if present
        return shortCode.startsWith('/') ? shortCode.substring(1) : shortCode;
      }
      return null;
    } catch (error) {
      verboseLog(`Error parsing short code from URL string: ${error}`);
      return null;
    }
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

  // Helper function to get company code from state or storage
  const getActiveCompanyCode = async (): Promise<string | null> => {
    verboseLog('Getting active company code...');
    let activeCompanyCode = companyCode;
    verboseLog(`Company code in React state: ${activeCompanyCode || 'empty'}`);
    
    if (!activeCompanyCode || (activeCompanyCode.trim() === '' && activeCompanyCode !== null)) {
      verboseLog('Company code not in state, checking AsyncStorage...');
      activeCompanyCode = await getValueFromAsync(ASYNC_KEYS.COMPANY_CODE);
      verboseLog(`Company code in AsyncStorage: ${activeCompanyCode || 'empty'}`);
      
      if (activeCompanyCode) {
        // Update state for future use
        setCompanyCode(activeCompanyCode);
        verboseLog('Updated React state with company code from storage');
      }
    }
    return activeCompanyCode;
  };

  // Helper function for verbose logging
  const verboseLog = (message: string) => {
    if (verboseLogging) {
      console.log(`[Insert Affiliate] [VERBOSE] ${message}`);
    }
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
    // Short codes are 3-25 characters and can include underscores
    const isValidCharacters = /^[a-zA-Z0-9_]+$/.test(referringLink);
    return isValidCharacters && referringLink.length >= 3 && referringLink.length <= 25;
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
  // Instead of just reading React state
  const returnInsertAffiliateIdentifier = async (): Promise<string | null> => {
    try {
      verboseLog('Getting insert affiliate identifier...');
      verboseLog(`React state - referrerLink: ${referrerLink || 'empty'}, userId: ${userId || 'empty'}`);
      
      // Try React state first
      if (referrerLink && userId) {
        const identifier = `${referrerLink}-${userId}`;
        verboseLog(`Found identifier in React state: ${identifier}`);
        return identifier;
      }
      
      verboseLog('React state empty, checking AsyncStorage...');
      
      // Fallback to async storage if React state is empty
      const storedLink = await getValueFromAsync(ASYNC_KEYS.REFERRER_LINK);
      const storedUserId = await getValueFromAsync(ASYNC_KEYS.USER_ID);
      
      verboseLog(`AsyncStorage - storedLink: ${storedLink || 'empty'}, storedUserId: ${storedUserId || 'empty'}`);
      
      if (storedLink && storedUserId) {
        const identifier = `${storedLink}-${storedUserId}`;
        verboseLog(`Found identifier in AsyncStorage: ${identifier}`);
        return identifier;
      }
      
      verboseLog('No affiliate identifier found in state or storage');
      return null;
    } catch (error) {
      verboseLog(`Error getting affiliate identifier: ${error}`);
      return null;
    }
  };

  // MARK: Insert Affiliate Identifier

  async function setInsertAffiliateIdentifier(
    referringLink: string
  ): Promise<void | string> {
    console.log('[Insert Affiliate] Setting affiliate identifier.');
    verboseLog(`Input referringLink: ${referringLink}`);

    try {
      verboseLog('Generating or retrieving user ID...');
      const customerID = await generateThenSetUserID();
      console.log(
        '[Insert Affiliate] Completed generateThenSetUserID within setInsertAffiliateIdentifier.'
      );
      verboseLog(`Customer ID: ${customerID}`);

      if (!referringLink) {
        console.warn('[Insert Affiliate] Referring link is invalid.');
        verboseLog('Referring link is empty or invalid, storing as-is');
        await storeInsertAffiliateIdentifier({ link: referringLink });
        return `${referringLink}-${customerID}`;
      }

      // Get company code from state or storage
      verboseLog('Getting company code...');
      const activeCompanyCode = await getActiveCompanyCode();
      verboseLog(`Active company code: ${activeCompanyCode || 'Not found'}`);
      
      if (!activeCompanyCode) {
        console.error(
          '[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.'
        );
        verboseLog('Company code missing, cannot proceed with API call');
        return;
      }

      // Check if referring link is already a short code, if so save it and stop here.
      verboseLog('Checking if referring link is already a short code...');
      if (isShortCode(referringLink)) {
        console.log(
          '[Insert Affiliate] Referring link is already a short code.'
        );
        verboseLog('Link is already a short code, storing directly');
        await storeInsertAffiliateIdentifier({ link: referringLink });
        return `${referringLink}-${customerID}`;
      }

      verboseLog('Link is not a short code, will convert via API');
      
      // If the code is not already a short code, encode it raedy to send to our endpoint to return the short code. Save it before making the call in case something goes wrong
      // Encode the referring link
      verboseLog('Encoding referring link for API call...');
      const encodedAffiliateLink = encodeURIComponent(referringLink);
      if (!encodedAffiliateLink) {
        console.error('[Insert Affiliate] Failed to encode affiliate link.');
        verboseLog('Failed to encode link, storing original');
        await storeInsertAffiliateIdentifier({ link: referringLink });
        return `${referringLink}-${customerID}`;
      }

      // Create the request URL
      const urlString = `https://api.insertaffiliate.com/V1/convert-deep-link-to-short-link?companyId=${activeCompanyCode}&deepLinkUrl=${encodedAffiliateLink}`;
      console.log('[Insert Affiliate] urlString .', urlString);
      verboseLog('Making API request to convert deep link to short code...');
      
      const response = await axios.get(urlString, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      verboseLog(`API response status: ${response.status}`);

      // Call to the backend for the short code and save the resolse in valid
      if (response.status === 200 && response.data.shortLink) {
        const shortLink = response.data.shortLink;
        console.log('[Insert Affiliate] Short link received:', shortLink);
        verboseLog(`Successfully converted to short link: ${shortLink}`);
        verboseLog('Storing short link to AsyncStorage...');
        await storeInsertAffiliateIdentifier({ link: shortLink });
        verboseLog('Short link stored successfully');
        return `${shortLink}-${customerID}`;
      } else {
        console.warn('[Insert Affiliate] Unexpected response format.');
        verboseLog(`Unexpected API response. Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
        verboseLog('Storing original link as fallback');
        await storeInsertAffiliateIdentifier({ link: referringLink });
        return `${referringLink}-${customerID}`;
      }
    } catch (error) {
      console.error('[Insert Affiliate] Error:', error);
      verboseLog(`Error in setInsertAffiliateIdentifier: ${error}`);
    }
  };
  
  async function storeInsertAffiliateIdentifier({ link }: { link: string }) {
    console.log(`[Insert Affiliate] Storing affiliate identifier: ${link}`);
    verboseLog(`Updating React state with referrer link: ${link}`);
    setReferrerLink(link);
    verboseLog(`Saving referrer link to AsyncStorage...`);
    await saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, link);
    verboseLog(`Referrer link saved to AsyncStorage successfully`);
    
    // Automatically fetch and store offer code for any affiliate identifier
    verboseLog('Attempting to fetch offer code for stored affiliate identifier...');
    await retrieveAndStoreOfferCode(link);
    
    // Trigger callback with the current affiliate identifier
    if (insertAffiliateIdentifierChangeCallbackRef.current) {
      const currentIdentifier = await returnInsertAffiliateIdentifier();
      verboseLog(`Triggering callback with identifier: ${currentIdentifier}`);
      insertAffiliateIdentifierChangeCallbackRef.current(currentIdentifier);
    }
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
    verboseLog(`Storing expected store transaction with token: ${purchaseToken}`);
    
    const activeCompanyCode = await getActiveCompanyCode();
    if (!activeCompanyCode) {
      console.error("[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.");
      verboseLog("Cannot store transaction: no company code available");
      return;
    }

    const shortCode = await returnInsertAffiliateIdentifier();
    if (!shortCode) {
      console.error("[Insert Affiliate] No affiliate identifier found. Please set one before tracking events.");
      verboseLog("Cannot store transaction: no affiliate identifier available");
      return;
    }

    verboseLog(`Company code: ${activeCompanyCode}, Short code: ${shortCode}`);

    // Build JSON payload
    const payload = {
      UUID: purchaseToken,
      companyCode: activeCompanyCode,
      shortCode,
      storedDate: new Date().toISOString(), // ISO8601 format
    };

    console.log("[Insert Affiliate] Storing expected transaction: ", payload);
    verboseLog("Making API call to store expected transaction...");

    try {
      const response = await fetch("https://api.insertaffiliate.com/v1/api/app-store-webhook/create-expected-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      verboseLog(`API response status: ${response.status}`);

      if (response.ok) {
        console.info("[Insert Affiliate] Expected transaction stored successfully.");
        verboseLog("Expected transaction stored successfully on server");
      } else {
        const errorText = await response.text();
        console.error(`[Insert Affiliate] Failed to store expected transaction with status code: ${response.status}. Response: ${errorText}`);
        verboseLog(`API error response: ${errorText}`);
      }
    } catch (error) {
      console.error(`[Insert Affiliate] Error storing expected transaction: ${error}`);
      verboseLog(`Network error storing transaction: ${error}`);
    }
  };

  // MARK: Track Event
  const trackEvent = async (eventName: string): Promise<void> => {
    try {
      verboseLog(`Tracking event: ${eventName}`);
      
      const activeCompanyCode = await getActiveCompanyCode();
      if (!activeCompanyCode) {
        console.error("[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.");
        verboseLog("Cannot track event: no company code available");
        return Promise.resolve();
      }

      console.log("track event called with - companyCode: ", activeCompanyCode);

      if (!referrerLink || !userId) {
        console.warn(
          '[Insert Affiliate] No affiliate identifier found. Please set one before tracking events.'
        );
        verboseLog("Cannot track event: no affiliate identifier available");
        return Promise.resolve();
      }

      const deepLinkParam = `${referrerLink}-${userId}`;
      verboseLog(`Deep link param: ${deepLinkParam}`);

      const payload = {
        eventName,
        deepLinkParam: deepLinkParam,
        companyId: activeCompanyCode,
      };

      verboseLog(`Track event payload: ${JSON.stringify(payload)}`);

      verboseLog("Making API call to track event...");
      
      const response = await axios.post(
        'https://api.insertaffiliate.com/v1/trackEvent',
        payload,
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      verboseLog(`Track event API response status: ${response.status}`);

      if (response.status === 200) {
        console.log('[Insert Affiliate] Event tracked successfully');
        verboseLog("Event tracked successfully on server");
      } else {
        console.error(
          `[Insert Affiliate] Failed to track event with status code: ${response.status}`
        );
        verboseLog(`Track event API error: status ${response.status}, response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error('[Insert Affiliate] Error tracking event:', error);
      verboseLog(`Network error tracking event: ${error}`);
      return Promise.reject(error);
    }
  };

  const fetchOfferCode = async (affiliateLink: string): Promise<string | null> => {
    try {
      const activeCompanyCode = await getActiveCompanyCode();
      if (!activeCompanyCode) {
        verboseLog('Cannot fetch offer code: no company code available');
        return null;
      }

      let platformType = 'ios'
      // Check if its iOs or Android here
      if (Platform.OS !== 'ios') {
        verboseLog('Platform is not iOS, setting platform type to android');
        platformType = 'android'
      } else {
        verboseLog('Platform is iOS, setting platform type to ios');
      }

      const encodedAffiliateLink = encodeURIComponent(affiliateLink);
      const url = `https://api.insertaffiliate.com/v1/affiliateReturnOfferCode/${activeCompanyCode}/${encodedAffiliateLink}?platformType=${platformType}`;
      
      verboseLog(`Starting to fetch offer code from: ${url}`);
      
      const response = await axios.get(url);
      
      if (response.status === 200) {
        const offerCode = response.data;
        
        // Check for specific error strings from API
        if (typeof offerCode === 'string' && (
          offerCode.includes("errorofferCodeNotFound") ||
          offerCode.includes("errorAffiliateoffercodenotfoundinanycompany") ||
          offerCode.includes("errorAffiliateoffercodenotfoundinanycompanyAffiliatelinkwas") ||
          offerCode.includes("Routenotfound")
        )) {
          console.warn(`[Insert Affiliate] Offer code not found or invalid: ${offerCode}`);
          verboseLog(`Offer code not found or invalid: ${offerCode}`);
          return null;
        }
        
        const cleanedOfferCode = cleanOfferCode(offerCode);
        verboseLog(`Successfully fetched and cleaned offer code: ${cleanedOfferCode}`);
        return cleanedOfferCode;
      } else {
        console.error(`[Insert Affiliate] Failed to fetch offer code. Status code: ${response.status}, Response: ${JSON.stringify(response.data)}`);
        verboseLog(`Failed to fetch offer code. Status code: ${response.status}, Response: ${JSON.stringify(response.data)}`);
        return null;
      }
    } catch (error) {
      console.error('[Insert Affiliate] Error fetching offer code:', error);
      verboseLog(`Error fetching offer code: ${error}`);
      return null;
    }
  };

  const retrieveAndStoreOfferCode = async (affiliateLink: string): Promise<void> => {
    try {
      verboseLog(`Attempting to retrieve and store offer code for: ${affiliateLink}`);
      
      const offerCode = await fetchOfferCode(affiliateLink);
      
      if (offerCode && offerCode.length > 0) {
        // Store in both AsyncStorage and state
        await saveValueInAsync(ASYNC_KEYS.IOS_OFFER_CODE, offerCode);
        setOfferCode(offerCode);
        verboseLog(`Successfully stored offer code: ${offerCode}`);
        console.log('[Insert Affiliate] Offer code retrieved and stored successfully');
      } else {
        verboseLog('No valid offer code found to store');
        // Clear stored offer code if none found
        await saveValueInAsync(ASYNC_KEYS.IOS_OFFER_CODE, '');
        setOfferCode(null);
      }
    } catch (error) {
      console.error('[Insert Affiliate] Error retrieving and storing offer code:', error);
      verboseLog(`Error in retrieveAndStoreOfferCode: ${error}`);
    }
  };

  const removeSpecialCharacters = (offerCode: string): string => {
    // Remove special characters, keep only alphanumeric, underscores, and hyphens
    return offerCode.replace(/[^a-zA-Z0-9_-]/g, '');
  };

  const cleanOfferCode = (offerCode: string): string => {
    // Remove special characters, keep only alphanumeric
    return removeSpecialCharacters(offerCode);
  };

  return (
    <DeepLinkIapContext.Provider
      value={{
        referrerLink,
        userId,
        OfferCode,
        setShortCode,
        returnInsertAffiliateIdentifier,
        storeExpectedStoreTransaction,
        returnUserAccountTokenAndStoreExpectedTransaction,
        validatePurchaseWithIapticAPI,
        trackEvent,
        setInsertAffiliateIdentifier,
        setInsertAffiliateIdentifierChangeCallback: setInsertAffiliateIdentifierChangeCallbackHandler,
        handleInsertLinks,
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

