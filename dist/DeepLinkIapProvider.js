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
    // iapLoading: false,
    // alreadyPurchased: false,
    // isIapticValidated: undefined,
    // subscriptions: [],
    // userPurchase: null,
    referrerLink: "",
    userId: "",
    // handleBuySubscription: (productId: string, offerToken?: string) => {},
    handlePurchaseValidation: (jsonIapPurchase) => __awaiter(void 0, void 0, void 0, function* () { }),
    trackEvent: (eventName) => __awaiter(void 0, void 0, void 0, function* () { }),
    setInsertAffiliateIdentifier: (referringLink, completion) => __awaiter(void 0, void 0, void 0, function* () { }),
    initialize: (code) => __awaiter(void 0, void 0, void 0, function* () { }),
    isInitialized: false
});
const DeepLinkIapProvider = ({ children, iapSkus, iapticAppId, iapticAppName, iapticPublicKey, }) => {
    // LOCAL STATES
    // const [iapLoading, setIapLoading] = useState<boolean>(false);
    // const [alreadyPurchased, setAlreadyPurchased] = useState<boolean>(false);
    // const [isIapticValidated, setIapticValidated] = useState<boolean | undefined>(
    //   undefined
    // );
    // const [userPurchase, setUserPurchase] = useState<Purchase | null>(null);
    const [referrerLink, setReferrerLink] = (0, react_1.useState)("");
    const [userId, setUserId] = (0, react_1.useState)("");
    const [companyCode, setCompanyCode] = (0, react_1.useState)(null);
    const [isInitialized, setIsInitialized] = (0, react_1.useState)(false);
    const initialize = (code) => __awaiter(void 0, void 0, void 0, function* () {
        if (isInitialized) {
            console.error("[Insert Affiliate] SDK is already initialized.");
            return;
        }
        if (code && code.trim() !== "") {
            setCompanyCode(code);
            setIsInitialized(true);
            console.log(`[Insert Affiliate] SDK initialized with company code: ${code}`);
        }
        else {
            console.warn("[Insert Affiliate] SDK initialized without a company code.");
            setIsInitialized(true);
        }
    });
    const reset = () => {
        setCompanyCode(null);
        setIsInitialized(false);
        console.log("[Insert Affiliate] SDK has been reset.");
    };
    // const {
    //   connected,
    //   purchaseHistory,
    //   getPurchaseHistory,
    //   getSubscriptions,
    //   subscriptions,
    //   finishTransaction,
    //   currentPurchase,
    //   currentPurchaseError,
    // } = useIAP();
    // ASYNC FUNCTIONS
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
    //   FUNCTION TO SHOW LOG, ERROR and WARN
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
    //   GENERATING UNIQUE USER ID
    const generateUserID = () => {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let uniqueId = "";
        for (let i = 0; i < 6; i++) {
            const randomIndex = Math.floor(Math.random() * characters.length);
            uniqueId += characters[randomIndex];
        }
        return uniqueId;
    };
    // Helper function to determine if a link is a short code
    const isShortCode = (referringLink) => {
        // Example check: short codes are less than 10 characters
        return referringLink.length < 10;
    };
    const setInsertAffiliateIdentifier = (referringLink, completion) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            let userId = yield getValueFromAsync(ASYNC_KEYS.USER_ID);
            if (!userId) {
                userId = generateUserID();
                yield saveValueInAsync(ASYNC_KEYS.USER_ID, userId);
                setUserId(userId);
            }
            if (!referringLink) {
                console.warn("[Insert Affiliate] Referring link is invalid.");
                yield saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, referringLink);
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
                yield saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, referringLink);
                completion(referringLink);
                return;
            }
            // If the code is not already a short code, encode it raedy to send to our endpoint to return the short code. Save it before making the call in case something goes wrong
            // Encode the referring link
            const encodedAffiliateLink = encodeURIComponent(referringLink);
            if (!encodedAffiliateLink) {
                console.error("[Insert Affiliate] Failed to encode affiliate link.");
                yield saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, referringLink);
                completion(null);
                return;
            }
            // Create the request URL
            const urlString = `http://api.insertaffiliate.com/V1/convert-deep-link-to-short-link?companyId=${companyCode}&deepLinkUrl=${encodedAffiliateLink}`;
            const response = yield axios_1.default.get(urlString, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            // Call to the backend for the short code and save the resolse in valid
            if (response.status === 200 && response.data.shortLink) {
                const shortLink = response.data.shortLink;
                console.log("[Insert Affiliate] Short link received:", shortLink);
                yield saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, shortLink);
                setReferrerLink(shortLink);
                completion(shortLink);
            }
            else {
                console.warn("[Insert Affiliate] Unexpected response format.");
                yield saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, referringLink);
                completion(null);
            }
        }
        catch (error) {
            console.error("[Insert Affiliate] Error:", error);
            completion(null);
        }
    });
    //   IN APP PURCHASE IMPLEMENTATION STARTS
    /**
     * This function is responsisble to
     * fetch the subscriptions
     */
    // const handleGetSubscriptions = async () => {
    //   try {
    //     await getSubscriptions({ skus: iapSkus });
    //   } catch (error) {
    //     errorLog(`handleGetSubscriptions: ${error}`, "error");
    //   }
    // };
    /**
     * This function is responsible to
     * fetch the purchase history
     */
    // const handleGetPurchaseHistory = async () => {
    //   try {
    //     await getPurchaseHistory();
    //     if (purchaseHistory.length > 0) {
    //       setAlreadyPurchased(true);
    //       setUserPurchase(currentPurchase ? currentPurchase : null);
    //     }
    //   } catch (error) {
    //     errorLog(`handleGetPurchaseHistory: ${error}`, "error");
    //   }
    // };
    //   Effect to fetch IAP subscriptions + purchase history
    // useEffect(() => {
    //   const fetchIapEssentials = async () => {
    //     try {
    //       await handleGetSubscriptions();
    //       await handleGetPurchaseHistory();
    //     } catch (error) {
    //       errorLog(`fetchIapEssentials: ${error}`);
    //     }
    //   };
    //   if (connected) fetchIapEssentials();
    // }, [connected]);
    const handlePurchaseValidation = (jsonIapPurchase) => __awaiter(void 0, void 0, void 0, function* () {
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
            if (userId && referrerLink) {
                requestBody.additionalData = {
                    applicationUsername: `${referrerLink}-${userId}`,
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
                // setIapticValidated(true);
                return true; // Indicate successful validation
            }
            else {
                console.error("Validation failed:", response.data);
                // setIapticValidated(false);
                return false; // Indicate successful validation
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`handlePurchaseValidation Error: ${error.message}`);
            }
            else {
                console.error(`handlePurchaseValidation Unknown Error: ${JSON.stringify(error)}`);
            }
            // setIapticValidated(false);
            return false;
        }
    });
    // useEffect(() => {
    //   const checkCurrentPurchase = async () => {
    //     try {
    //       if (currentPurchase?.productId) {
    //         setUserPurchase(currentPurchase);
    //         await handlePurchaseValidation(currentPurchase);
    //         await finishTransaction({
    //           purchase: currentPurchase,
    //           isConsumable: true,
    //         });
    //         await saveValueInAsync(
    //           ASYNC_KEYS.USER_PURCHASE,
    //           JSON.stringify(currentPurchase)
    //         );
    //         setIapLoading(false);
    //       }
    //     } catch (error) {
    //       setIapLoading(false);
    //       errorLog(`checkCurrentPurchase: ${error}`, "error");
    //     }
    //   };
    //   checkCurrentPurchase();
    // }, [currentPurchase, finishTransaction]);
    // useEffect(() => {
    //   const checkCurrentPurchaseError = async () => {
    //     if (currentPurchaseError) {
    //       setIapLoading(false);
    //       errorLog(
    //         `checkCurrentPurchaseError: ${currentPurchaseError.message}`,
    //         "error"
    //       );
    //     }
    //   };
    //   checkCurrentPurchaseError();
    // }, [currentPurchaseError]);
    /**
     * Function is responsible to
     * buy a subscription
     * @param {string} productId
     * @param {string} [offerToken]
     */
    // const handleBuySubscription = async (
    //   productId: string,
    //   offerToken?: string
    // ) => {
    //   if (isPlay && !offerToken) {
    //     console.warn(
    //       `There are no subscription Offers for selected product (Only requiered for Google Play purchases): ${productId}`
    //     );
    //   }
    //   try {
    //     setIapLoading(true);
    //     await requestSubscription({
    //       sku: productId,
    //       ...(offerToken && {
    //         subscriptionOffers: [{ sku: productId, offerToken }],
    //       }),
    //     });
    //   } catch (error) {
    //     setIapLoading(false);
    //     errorLog(`handleBuySubscription: ${error}`, "error");
    //   }
    // };
    const trackEvent = (eventName) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (!referrerLink || !userId) {
                console.warn("[Insert Affiliate] No affiliate identifier found. Please set one before tracking events.");
                return Promise.resolve();
            }
            const payload = {
                eventName,
                deepLinkParam: `${referrerLink}/${userId}`, // Similar to Swift SDK
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
    // useEffect(() => {
    //   return () => {
    //     endConnection();
    //   };
    // }, []);
    return (react_1.default.createElement(exports.DeepLinkIapContext.Provider, { value: {
            // iapLoading,
            // alreadyPurchased,
            // isIapticValidated,
            // subscriptions,
            // userPurchase,
            referrerLink,
            userId,
            // handleBuySubscription,
            handlePurchaseValidation,
            trackEvent,
            setInsertAffiliateIdentifier,
            initialize,
            isInitialized
        } }, children));
};
exports.default = DeepLinkIapProvider;
