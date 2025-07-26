"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepLinkIapContext = void 0;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const axios_1 = __importDefault(require("axios"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const ASYNC_KEYS = {
    REFERRER_LINK: '@app_referrer_link',
    USER_PURCHASE: '@app_user_purchase',
    USER_ID: '@app_user_id',
    COMPANY_CODE: '@app_company_code',
    USER_ACCOUNT_TOKEN: '@app_user_account_token',
    IOS_OFFER_CODE: '@app_ios_offer_code',
};
// STARTING CONTEXT IMPLEMENTATION
exports.DeepLinkIapContext = (0, react_1.createContext)({
    referrerLink: '',
    userId: '',
    OfferCode: null,
    returnInsertAffiliateIdentifier: () => __awaiter(void 0, void 0, void 0, function* () { return ''; }),
    validatePurchaseWithIapticAPI: (jsonIapPurchase, iapticAppId, iapticAppName, iapticPublicKey) => __awaiter(void 0, void 0, void 0, function* () { return false; }),
    returnUserAccountTokenAndStoreExpectedTransaction: () => __awaiter(void 0, void 0, void 0, function* () { return ''; }),
    storeExpectedStoreTransaction: (purchaseToken) => __awaiter(void 0, void 0, void 0, function* () { }),
    trackEvent: (eventName) => __awaiter(void 0, void 0, void 0, function* () { }),
    setShortCode: (shortCode) => __awaiter(void 0, void 0, void 0, function* () { }),
    setInsertAffiliateIdentifier: (referringLink) => __awaiter(void 0, void 0, void 0, function* () { }),
    initialize: (code, verboseLogging) => __awaiter(void 0, void 0, void 0, function* () { }),
    isInitialized: false,
});
const DeepLinkIapProvider = ({ children, }) => {
    const [referrerLink, setReferrerLink] = (0, react_1.useState)('');
    const [userId, setUserId] = (0, react_1.useState)('');
    const [companyCode, setCompanyCode] = (0, react_1.useState)(null);
    const [isInitialized, setIsInitialized] = (0, react_1.useState)(false);
    const [verboseLogging, setVerboseLogging] = (0, react_1.useState)(false);
    const [OfferCode, setOfferCode] = (0, react_1.useState)(null);
    // MARK: Initialize the SDK
    const initialize = (companyCode_1, ...args_1) => __awaiter(void 0, [companyCode_1, ...args_1], void 0, function* (companyCode, verboseLogging = false) {
        setVerboseLogging(verboseLogging);
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
            yield saveValueInAsync(ASYNC_KEYS.COMPANY_CODE, companyCode);
            setIsInitialized(true);
            console.log(`[Insert Affiliate] SDK initialized with company code: ${companyCode}`);
            if (verboseLogging) {
                console.log('[Insert Affiliate] [VERBOSE] Company code saved to AsyncStorage');
                console.log('[Insert Affiliate] [VERBOSE] SDK marked as initialized');
            }
        }
        else {
            console.warn('[Insert Affiliate] SDK initialized without a company code.');
            setIsInitialized(true);
            if (verboseLogging) {
                console.log('[Insert Affiliate] [VERBOSE] No company code provided, SDK initialized in limited mode');
            }
        }
    });
    // EFFECT TO FETCH USER ID AND REF LINK
    // IF ALREADY EXISTS IN ASYNC STORAGE
    (0, react_1.useEffect)(() => {
        const fetchAsyncEssentials = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                verboseLog('Loading stored data from AsyncStorage...');
                const uId = yield getValueFromAsync(ASYNC_KEYS.USER_ID);
                const refLink = yield getValueFromAsync(ASYNC_KEYS.REFERRER_LINK);
                const companyCodeFromStorage = yield getValueFromAsync(ASYNC_KEYS.COMPANY_CODE);
                const storedOfferCode = yield getValueFromAsync(ASYNC_KEYS.IOS_OFFER_CODE);
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
            }
            catch (error) {
                errorLog(`ERROR ~ fetchAsyncEssentials: ${error}`);
                verboseLog(`Error loading from AsyncStorage: ${error}`);
            }
        });
        fetchAsyncEssentials();
    }, []);
    function generateThenSetUserID() {
        return __awaiter(this, void 0, void 0, function* () {
            verboseLog('Getting or generating user ID...');
            let userId = yield getValueFromAsync(ASYNC_KEYS.USER_ID);
            if (!userId) {
                verboseLog('No existing user ID found, generating new one...');
                userId = generateUserID();
                setUserId(userId);
                yield saveValueInAsync(ASYNC_KEYS.USER_ID, userId);
                verboseLog(`Generated and saved new user ID: ${userId}`);
            }
            else {
                verboseLog(`Found existing user ID: ${userId}`);
                setUserId(userId);
            }
            return userId;
        });
    }
    const generateUserID = () => {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let uniqueId = '';
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            uniqueId += characters[randomIndex];
        }
        return uniqueId;
    };
    const reset = () => {
        setCompanyCode(null);
        setIsInitialized(false);
        console.log('[Insert Affiliate] SDK has been reset.');
    };
    // Helper funciton Storage / Retrieval
    const saveValueInAsync = (key, value) => __awaiter(void 0, void 0, void 0, function* () {
        yield async_storage_1.default.setItem(key, value);
    });
    const getValueFromAsync = (key) => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield async_storage_1.default.getItem(key);
        return response;
    });
    const clearAsyncStorage = () => __awaiter(void 0, void 0, void 0, function* () {
        yield async_storage_1.default.clear();
    });
    // Helper function to get company code from state or storage
    const getActiveCompanyCode = () => __awaiter(void 0, void 0, void 0, function* () {
        verboseLog('Getting active company code...');
        let activeCompanyCode = companyCode;
        verboseLog(`Company code in React state: ${activeCompanyCode || 'empty'}`);
        if (!activeCompanyCode || (activeCompanyCode.trim() === '' && activeCompanyCode !== null)) {
            verboseLog('Company code not in state, checking AsyncStorage...');
            activeCompanyCode = yield getValueFromAsync(ASYNC_KEYS.COMPANY_CODE);
            verboseLog(`Company code in AsyncStorage: ${activeCompanyCode || 'empty'}`);
            if (activeCompanyCode) {
                // Update state for future use
                setCompanyCode(activeCompanyCode);
                verboseLog('Updated React state with company code from storage');
            }
        }
        return activeCompanyCode;
    });
    // Helper function for verbose logging
    const verboseLog = (message) => {
        if (verboseLogging) {
            console.log(`[Insert Affiliate] [VERBOSE] ${message}`);
        }
    };
    // Helper function to log errors
    const errorLog = (message, type) => {
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
    const isShortCode = (referringLink) => {
        // Short codes are 3-25 characters and can include underscores
        const isValidCharacters = /^[a-zA-Z0-9_]+$/.test(referringLink);
        return isValidCharacters && referringLink.length >= 3 && referringLink.length <= 25;
    };
    function setShortCode(shortCode) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Insert Affiliate] Setting short code.');
            yield generateThenSetUserID();
            // Validate it is a short code
            const capitalisedShortCode = shortCode.toUpperCase();
            isShortCode(capitalisedShortCode);
            // If all checks pass, set the Insert Affiliate Identifier
            yield storeInsertAffiliateIdentifier({ link: capitalisedShortCode });
        });
    }
    function getOrCreateUserAccountToken() {
        return __awaiter(this, void 0, void 0, function* () {
            let userAccountToken = yield getValueFromAsync(ASYNC_KEYS.USER_ACCOUNT_TOKEN);
            if (!userAccountToken) {
                userAccountToken = UUID();
                yield saveValueInAsync(ASYNC_KEYS.USER_ACCOUNT_TOKEN, userAccountToken);
            }
            return userAccountToken;
        });
    }
    ;
    const returnUserAccountTokenAndStoreExpectedTransaction = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const shortCode = yield returnInsertAffiliateIdentifier();
            if (!shortCode) {
                console.log('[Insert Affiliate] No affiliate stored - not saving expected transaction.');
                return null;
            }
            const userAccountToken = yield getOrCreateUserAccountToken();
            console.log('[Insert Affiliate] User account token:', userAccountToken);
            if (!userAccountToken) {
                console.error('[Insert Affiliate] Failed to generate user account token.');
                return null;
            }
            else {
                yield storeExpectedStoreTransaction(userAccountToken);
                return userAccountToken;
            }
        }
        catch (error) {
            console.error('[Insert Affiliate] Error in returnUserAccountTokenAndStoreExpectedTransaction:', error);
            return null;
        }
        ;
    });
    // MARK: Return Insert Affiliate Identifier
    // Instead of just reading React state
    const returnInsertAffiliateIdentifier = () => __awaiter(void 0, void 0, void 0, function* () {
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
            const storedLink = yield getValueFromAsync(ASYNC_KEYS.REFERRER_LINK);
            const storedUserId = yield getValueFromAsync(ASYNC_KEYS.USER_ID);
            verboseLog(`AsyncStorage - storedLink: ${storedLink || 'empty'}, storedUserId: ${storedUserId || 'empty'}`);
            if (storedLink && storedUserId) {
                const identifier = `${storedLink}-${storedUserId}`;
                verboseLog(`Found identifier in AsyncStorage: ${identifier}`);
                return identifier;
            }
            verboseLog('No affiliate identifier found in state or storage');
            return null;
        }
        catch (error) {
            verboseLog(`Error getting affiliate identifier: ${error}`);
            return null;
        }
    });
    // MARK: Insert Affiliate Identifier
    function setInsertAffiliateIdentifier(referringLink) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('[Insert Affiliate] Setting affiliate identifier.');
            verboseLog(`Input referringLink: ${referringLink}`);
            try {
                verboseLog('Generating or retrieving user ID...');
                const customerID = yield generateThenSetUserID();
                console.log('[Insert Affiliate] Completed generateThenSetUserID within setInsertAffiliateIdentifier.');
                verboseLog(`Customer ID: ${customerID}`);
                if (!referringLink) {
                    console.warn('[Insert Affiliate] Referring link is invalid.');
                    verboseLog('Referring link is empty or invalid, storing as-is');
                    yield storeInsertAffiliateIdentifier({ link: referringLink });
                    return `${referringLink}-${customerID}`;
                }
                // Get company code from state or storage
                verboseLog('Getting company code...');
                const activeCompanyCode = yield getActiveCompanyCode();
                verboseLog(`Active company code: ${activeCompanyCode || 'Not found'}`);
                if (!activeCompanyCode) {
                    console.error('[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.');
                    verboseLog('Company code missing, cannot proceed with API call');
                    return;
                }
                // Check if referring link is already a short code, if so save it and stop here.
                verboseLog('Checking if referring link is already a short code...');
                if (isShortCode(referringLink)) {
                    console.log('[Insert Affiliate] Referring link is already a short code.');
                    verboseLog('Link is already a short code, storing directly');
                    yield storeInsertAffiliateIdentifier({ link: referringLink });
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
                    yield storeInsertAffiliateIdentifier({ link: referringLink });
                    return `${referringLink}-${customerID}`;
                }
                // Create the request URL
                const urlString = `https://api.insertaffiliate.com/V1/convert-deep-link-to-short-link?companyId=${activeCompanyCode}&deepLinkUrl=${encodedAffiliateLink}`;
                console.log('[Insert Affiliate] urlString .', urlString);
                verboseLog('Making API request to convert deep link to short code...');
                const response = yield axios_1.default.get(urlString, {
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
                    yield storeInsertAffiliateIdentifier({ link: shortLink });
                    verboseLog('Short link stored successfully');
                    return `${shortLink}-${customerID}`;
                }
                else {
                    console.warn('[Insert Affiliate] Unexpected response format.');
                    verboseLog(`Unexpected API response. Status: ${response.status}, Data: ${JSON.stringify(response.data)}`);
                    verboseLog('Storing original link as fallback');
                    yield storeInsertAffiliateIdentifier({ link: referringLink });
                    return `${referringLink}-${customerID}`;
                }
            }
            catch (error) {
                console.error('[Insert Affiliate] Error:', error);
                verboseLog(`Error in setInsertAffiliateIdentifier: ${error}`);
            }
        });
    }
    ;
    function storeInsertAffiliateIdentifier(_a) {
        return __awaiter(this, arguments, void 0, function* ({ link }) {
            console.log(`[Insert Affiliate] Storing affiliate identifier: ${link}`);
            verboseLog(`Updating React state with referrer link: ${link}`);
            setReferrerLink(link);
            verboseLog(`Saving referrer link to AsyncStorage...`);
            yield saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, link);
            verboseLog(`Referrer link saved to AsyncStorage successfully`);
            // Automatically fetch and store offer code for any affiliate identifier
            verboseLog('Attempting to fetch offer code for stored affiliate identifier...');
            yield retrieveAndStoreOfferCode(link);
        });
    }
    const validatePurchaseWithIapticAPI = (jsonIapPurchase, iapticAppId, iapticAppName, iapticPublicKey) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const baseRequestBody = {
                id: iapticAppId,
                type: 'application',
            };
            let transaction;
            if (react_native_1.Platform.OS === 'ios') {
                transaction = {
                    id: iapticAppId,
                    type: 'ios-appstore',
                    appStoreReceipt: jsonIapPurchase.transactionReceipt,
                };
            }
            else {
                const receiptJson = JSON.parse(atob(jsonIapPurchase.transactionReceipt || ''));
                transaction = {
                    id: receiptJson.orderId, // Extracted orderId
                    type: 'android-playstore',
                    purchaseToken: receiptJson.purchaseToken, // Extracted purchase token
                    receipt: jsonIapPurchase.transactionReceipt, // Full receipt (Base64)
                    signature: receiptJson.signature, // Receipt signature
                };
            }
            const requestBody = Object.assign(Object.assign({}, baseRequestBody), { transaction });
            let insertAffiliateIdentifier = yield returnInsertAffiliateIdentifier();
            if (insertAffiliateIdentifier) {
                requestBody.additionalData = {
                    applicationUsername: `${insertAffiliateIdentifier}`,
                };
            }
            // Send validation request to server
            const response = yield (0, axios_1.default)({
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
            }
            else {
                console.error('Validation failed:', response.data);
                return false;
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`validatePurchaseWithIapticAPI Error: ${error.message}`);
            }
            else {
                console.error(`validatePurchaseWithIapticAPI Unknown Error: ${JSON.stringify(error)}`);
            }
            return false;
        }
    });
    const storeExpectedStoreTransaction = (purchaseToken) => __awaiter(void 0, void 0, void 0, function* () {
        verboseLog(`Storing expected store transaction with token: ${purchaseToken}`);
        const activeCompanyCode = yield getActiveCompanyCode();
        if (!activeCompanyCode) {
            console.error("[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.");
            verboseLog("Cannot store transaction: no company code available");
            return;
        }
        const shortCode = yield returnInsertAffiliateIdentifier();
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
            const response = yield fetch("https://api.insertaffiliate.com/v1/api/app-store-webhook/create-expected-transaction", {
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
            }
            else {
                const errorText = yield response.text();
                console.error(`[Insert Affiliate] Failed to store expected transaction with status code: ${response.status}. Response: ${errorText}`);
                verboseLog(`API error response: ${errorText}`);
            }
        }
        catch (error) {
            console.error(`[Insert Affiliate] Error storing expected transaction: ${error}`);
            verboseLog(`Network error storing transaction: ${error}`);
        }
    });
    // MARK: Track Event
    const trackEvent = (eventName) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            verboseLog(`Tracking event: ${eventName}`);
            const activeCompanyCode = yield getActiveCompanyCode();
            if (!activeCompanyCode) {
                console.error("[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.");
                verboseLog("Cannot track event: no company code available");
                return Promise.resolve();
            }
            console.log("track event called with - companyCode: ", activeCompanyCode);
            if (!referrerLink || !userId) {
                console.warn('[Insert Affiliate] No affiliate identifier found. Please set one before tracking events.');
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
            const response = yield axios_1.default.post('https://api.insertaffiliate.com/v1/trackEvent', payload, {
                headers: { 'Content-Type': 'application/json' },
            });
            verboseLog(`Track event API response status: ${response.status}`);
            if (response.status === 200) {
                console.log('[Insert Affiliate] Event tracked successfully');
                verboseLog("Event tracked successfully on server");
            }
            else {
                console.error(`[Insert Affiliate] Failed to track event with status code: ${response.status}`);
                verboseLog(`Track event API error: status ${response.status}, response: ${JSON.stringify(response.data)}`);
            }
        }
        catch (error) {
            console.error('[Insert Affiliate] Error tracking event:', error);
            verboseLog(`Network error tracking event: ${error}`);
            return Promise.reject(error);
        }
    });
    const fetchOfferCode = (affiliateLink) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const activeCompanyCode = yield getActiveCompanyCode();
            if (!activeCompanyCode) {
                verboseLog('Cannot fetch offer code: no company code available');
                return null;
            }
            let platformType = 'ios';
            // Check if its iOs or Android here
            if (react_native_1.Platform.OS !== 'ios') {
                verboseLog('Platform is not iOS, setting platform type to android');
                platformType = 'android';
            }
            else {
                verboseLog('Platform is iOS, setting platform type to ios');
            }
            const encodedAffiliateLink = encodeURIComponent(affiliateLink);
            const url = `https://api.insertaffiliate.com/v1/affiliateReturnOfferCode/${activeCompanyCode}/${encodedAffiliateLink}?platformType=${platformType}`;
            verboseLog(`Fetching offer code from: ${url}`);
            const response = yield axios_1.default.get(url);
            if (response.status === 200) {
                const offerCode = response.data;
                // Check for specific error strings from API
                if (typeof offerCode === 'string' && (offerCode.includes("errorofferCodeNotFound") ||
                    offerCode.includes("errorAffiliateoffercodenotfoundinanycompany") ||
                    offerCode.includes("errorAffiliateoffercodenotfoundinanycompanyAffiliatelinkwas") ||
                    offerCode.includes("Routenotfound"))) {
                    console.warn(`[Insert Affiliate] Offer code not found or invalid: ${offerCode}`);
                    verboseLog(`Offer code not found or invalid: ${offerCode}`);
                    return null;
                }
                const cleanedOfferCode = cleanOfferCode(offerCode);
                verboseLog(`Successfully fetched and cleaned offer code: ${cleanedOfferCode}`);
                return cleanedOfferCode;
            }
            else {
                console.error(`[Insert Affiliate] Failed to fetch offer code. Status code: ${response.status}, Response: ${JSON.stringify(response.data)}`);
                verboseLog(`Failed to fetch offer code. Status code: ${response.status}, Response: ${JSON.stringify(response.data)}`);
                return null;
            }
        }
        catch (error) {
            console.error('[Insert Affiliate] Error fetching offer code:', error);
            verboseLog(`Error fetching offer code: ${error}`);
            return null;
        }
    });
    const retrieveAndStoreOfferCode = (affiliateLink) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            verboseLog(`Attempting to retrieve and store offer code for: ${affiliateLink}`);
            const offerCode = yield fetchOfferCode(affiliateLink);
            if (offerCode && offerCode.length > 0) {
                // Store in both AsyncStorage and state
                yield saveValueInAsync(ASYNC_KEYS.IOS_OFFER_CODE, offerCode);
                setOfferCode(offerCode);
                verboseLog(`Successfully stored offer code: ${offerCode}`);
                console.log('[Insert Affiliate] Offer code retrieved and stored successfully');
            }
            else {
                verboseLog('No valid offer code found to store');
                // Clear stored offer code if none found
                yield saveValueInAsync(ASYNC_KEYS.IOS_OFFER_CODE, '');
                setOfferCode(null);
            }
        }
        catch (error) {
            console.error('[Insert Affiliate] Error retrieving and storing offer code:', error);
            verboseLog(`Error in retrieveAndStoreOfferCode: ${error}`);
        }
    });
    const removeSpecialCharacters = (offerCode) => {
        // Remove special characters, keep only alphanumeric and underscores
        return offerCode.replace(/[^a-zA-Z0-9_]/g, '');
    };
    const cleanOfferCode = (offerCode) => {
        // Remove special characters, keep only alphanumeric
        return removeSpecialCharacters(offerCode);
    };
    return (react_1.default.createElement(exports.DeepLinkIapContext.Provider, { value: {
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
            initialize,
            isInitialized,
        } }, children));
};
exports.default = DeepLinkIapProvider;
function UUID() {
    // Generate a random UUID (version 4)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
