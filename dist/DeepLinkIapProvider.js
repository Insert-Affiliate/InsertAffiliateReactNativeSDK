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
    REFERRER_LINK: "@app_referrer_link",
    USER_PURCHASE: "@app_user_purchase",
    USER_ID: "@app_user_id",
};
// STARTING CONTEXT IMPLEMENTATION
exports.DeepLinkIapContext = (0, react_1.createContext)({
    referrerLink: "",
    userId: "",
    returnInsertAffiliateIdentifier: () => __awaiter(void 0, void 0, void 0, function* () { return ""; }),
    validatePurchaseWithIapticAPI: (jsonIapPurchase, iapticAppId, iapticAppName, iapticPublicKey) => __awaiter(void 0, void 0, void 0, function* () { return false; }),
    trackEvent: (eventName) => __awaiter(void 0, void 0, void 0, function* () { }),
    setShortCode: (shortCode) => __awaiter(void 0, void 0, void 0, function* () { }),
    setInsertAffiliateIdentifier: (referringLink, completion) => __awaiter(void 0, void 0, void 0, function* () { }),
    initialize: (code) => __awaiter(void 0, void 0, void 0, function* () { }),
    isInitialized: false
});
const DeepLinkIapProvider = ({ children, }) => {
    const [referrerLink, setReferrerLink] = (0, react_1.useState)("");
    const [userId, setUserId] = (0, react_1.useState)("");
    const [companyCode, setCompanyCode] = (0, react_1.useState)(null);
    const [isInitialized, setIsInitialized] = (0, react_1.useState)(false);
    // MARK: Initialize the SDK
    const initialize = (companyCode) => __awaiter(void 0, void 0, void 0, function* () {
        if (isInitialized) {
            console.error("[Insert Affiliate] SDK is already initialized.");
            return;
        }
        if (companyCode && companyCode.trim() !== "") {
            setCompanyCode(companyCode);
            setIsInitialized(true);
            console.log(`[Insert Affiliate] SDK initialized with company code: ${companyCode}`);
        }
        else {
            console.warn("[Insert Affiliate] SDK initialized without a company code.");
            setIsInitialized(true);
        }
    });
    // EFFECT TO FETCH USER ID AND REF LINK
    // IF ALREADY EXISTS IN ASYNC STORAGE
    (0, react_1.useEffect)(() => {
        const fetchAsyncEssentials = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const uId = yield getValueFromAsync(ASYNC_KEYS.USER_ID);
                const refLink = yield getValueFromAsync(ASYNC_KEYS.REFERRER_LINK);
                if (uId && refLink) {
                    setUserId(uId);
                    setReferrerLink(refLink);
                }
            }
            catch (error) {
                errorLog(`ERROR ~ fetchAsyncEssentials: ${error}`);
            }
        });
        fetchAsyncEssentials();
    }, []);
    function generateThenSetUserID() {
        return __awaiter(this, void 0, void 0, function* () {
            let userId = yield getValueFromAsync(ASYNC_KEYS.USER_ID);
            if (!userId) {
                userId = generateUserID();
                yield saveValueInAsync(ASYNC_KEYS.USER_ID, userId);
                setUserId(userId);
            }
        });
    }
    const generateUserID = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let uniqueId = "";
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            uniqueId += characters[randomIndex];
        }
        return uniqueId;
    };
    const reset = () => {
        setCompanyCode(null);
        setIsInitialized(false);
        console.log("[Insert Affiliate] SDK has been reset.");
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
    // Helper function to log errors
    const errorLog = (message, type) => {
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
    // MARK: Short Codes
    const isShortCode = (referringLink) => {
        // Short codes are less than 10 characters
        const isValidCharacters = /^[a-zA-Z0-9]+$/.test(referringLink);
        return isValidCharacters && referringLink.length < 10;
    };
    function setShortCode(shortCode) {
        return __awaiter(this, void 0, void 0, function* () {
            generateThenSetUserID();
            // Validate it is a short code
            const capitalisedShortCode = shortCode.toUpperCase();
            isShortCode(capitalisedShortCode);
            // If all checks pass, set the Insert Affiliate Identifier
            yield storeInsertAffiliateIdentifier({ link: capitalisedShortCode });
        });
    }
    // MARK: Return Insert Affiliate Identifier
    const returnInsertAffiliateIdentifier = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            return `${referrerLink}-${userId}`;
        }
        catch (error) {
            errorLog(`ERROR ~ returnInsertAffiliateIdentifier: ${error}`);
            return null;
        }
    });
    // MARK: Insert Affiliate Identifier
    const setInsertAffiliateIdentifier = (referringLink, completion) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            try {
                generateThenSetUserID();
            }
            catch (error) {
                console.error("[Insert Affiliate] Error setting user ID:", error);
            }
            if (!referringLink) {
                console.warn("[Insert Affiliate] Referring link is invalid.");
                storeInsertAffiliateIdentifier({ link: referringLink });
                completion(null);
                return;
            }
            if (!isInitialized || !companyCode) {
                console.error("[Insert Affiliate] SDK is not initialized. Please initialize the SDK with a valid company code.");
                completion(null);
                return;
            }
            if (!companyCode || companyCode.trim() === "") {
                console.error("[Insert Affiliate] Company code is not set. Please initialize the SDK with a valid company code.");
                completion(null);
                return;
            }
            // Check if referring link is already a short code, if so save it and stop here.
            if (isShortCode(referringLink)) {
                console.log("[Insert Affiliate] Referring link is already a short code.");
                storeInsertAffiliateIdentifier({ link: referringLink });
                completion(referringLink);
                return;
            }
            // If the code is not already a short code, encode it raedy to send to our endpoint to return the short code. Save it before making the call in case something goes wrong
            // Encode the referring link
            const encodedAffiliateLink = encodeURIComponent(referringLink);
            if (!encodedAffiliateLink) {
                console.error("[Insert Affiliate] Failed to encode affiliate link.");
                storeInsertAffiliateIdentifier({ link: referringLink });
                completion(null);
                return;
            }
            // Create the request URL
            const urlString = `https://api.insertaffiliate.com/V1/convert-deep-link-to-short-link?companyId=${companyCode}&deepLinkUrl=${encodedAffiliateLink}`;
            const response = yield axios_1.default.get(urlString, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            // Call to the backend for the short code and save the resolse in valid
            if (response.status === 200 && response.data.shortLink) {
                const shortLink = response.data.shortLink;
                console.log("[Insert Affiliate] Short link received:", shortLink);
                storeInsertAffiliateIdentifier({ link: shortLink });
                completion(shortLink);
            }
            else {
                console.warn("[Insert Affiliate] Unexpected response format.");
                storeInsertAffiliateIdentifier({ link: referringLink });
                completion(null);
            }
        }
        catch (error) {
            console.error("[Insert Affiliate] Error:", error);
            completion(null);
        }
    });
    function storeInsertAffiliateIdentifier(_a) {
        return __awaiter(this, arguments, void 0, function* ({ link }) {
            console.log(`[Insert Affiliate] Storing affiliate identifier: ${link}`);
            yield saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, link);
            setReferrerLink(link);
        });
    }
    const validatePurchaseWithIapticAPI = (jsonIapPurchase, iapticAppId, iapticAppName, iapticPublicKey) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const baseRequestBody = {
                id: iapticAppId,
                type: "application",
            };
            let transaction;
            if (react_native_1.Platform.OS === "ios") {
                transaction = {
                    id: iapticAppId,
                    type: "ios-appstore",
                    appStoreReceipt: jsonIapPurchase.transactionReceipt,
                };
            }
            else {
                const receiptJson = JSON.parse(atob(jsonIapPurchase.transactionReceipt || ""));
                transaction = {
                    id: receiptJson.orderId, // Extracted orderId
                    type: "android-playstore",
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
            }
            else {
                console.error("Validation failed:", response.data);
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
    // MARK: Track Event 
    const trackEvent = (eventName) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!referrerLink || !userId) {
                console.warn("[Insert Affiliate] No affiliate identifier found. Please set one before tracking events.");
                return Promise.resolve();
            }
            const payload = {
                eventName,
                deepLinkParam: `${referrerLink}/${userId}`,
            };
            const response = yield axios_1.default.post("https://api.insertaffiliate.com/v1/trackEvent", payload, {
                headers: { "Content-Type": "application/json" },
            });
            if (response.status === 200) {
                console.log("[Insert Affiliate] Event tracked successfully");
            }
            else {
                console.error(`[Insert Affiliate] Failed to track event with status code: ${response.status}`);
            }
        }
        catch (error) {
            console.error("[Insert Affiliate] Error tracking event:", error);
            return Promise.reject(error);
        }
    });
    return (react_1.default.createElement(exports.DeepLinkIapContext.Provider, { value: {
            referrerLink,
            userId,
            setShortCode,
            returnInsertAffiliateIdentifier,
            validatePurchaseWithIapticAPI,
            trackEvent,
            setInsertAffiliateIdentifier,
            initialize,
            isInitialized
        } }, children));
};
exports.default = DeepLinkIapProvider;
