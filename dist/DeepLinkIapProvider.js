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
const react_native_iap_1 = require("react-native-iap");
const internal_1 = require("react-native-iap/src/internal");
const react_native_branch_1 = __importDefault(require("react-native-branch"));
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
    iapLoading: false,
    alreadyPurchased: false,
    isIapticValidated: undefined,
    subscriptions: [],
    userPurchase: null,
    referrerLink: "",
    userId: "",
    handleBuySubscription: (productId, offerToken) => { },
    trackEvent: (eventName) => __awaiter(void 0, void 0, void 0, function* () { }),
});
const DeepLinkIapProvider = ({ children, iapSkus, iapticAppId, iapticAppName, iapticPublicKey, }) => {
    // LOCAL STATES
    const [iapLoading, setIapLoading] = (0, react_1.useState)(false);
    const [alreadyPurchased, setAlreadyPurchased] = (0, react_1.useState)(false);
    const [isIapticValidated, setIapticValidated] = (0, react_1.useState)(undefined);
    const [userPurchase, setUserPurchase] = (0, react_1.useState)(null);
    const [referrerLink, setReferrerLink] = (0, react_1.useState)("");
    const [userId, setUserId] = (0, react_1.useState)("");
    const { connected, purchaseHistory, getPurchaseHistory, getSubscriptions, subscriptions, finishTransaction, currentPurchase, currentPurchaseError, } = (0, react_native_iap_1.useIAP)();
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
    //   BRANCH IMPLEMENTATION
    (0, react_1.useEffect)(() => {
        console.log("Insert Affiliate - using local version!!");
        const branchSubscription = react_native_branch_1.default.subscribe((_a) => __awaiter(void 0, [_a], void 0, function* ({ error, params }) {
            if (error) {
                errorLog(`branchSubscription: ${JSON.stringify(error)}`, "error");
                return;
            }
            else if (!params) {
                errorLog(`branchSubscription: params does not exits`, "warn");
                return;
            }
            else if (!params["+clicked_branch_link"]) {
                errorLog(`branchSubscription: Not a branch link`, "warn");
                return;
            }
            else {
                if (params["~referring_link"]) {
                    setReferrerLink(params["~referring_link"]);
                    const userId = generateUserID();
                    setUserId(userId);
                    yield saveValueInAsync(ASYNC_KEYS.USER_ID, userId);
                    yield saveValueInAsync(ASYNC_KEYS.REFERRER_LINK, params["~referring_link"]);
                }
                else
                    errorLog(`branchSubscription: Params does't have referring_link`, "warn");
            }
        }));
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
    const handleGetSubscriptions = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield getSubscriptions({ skus: iapSkus });
        }
        catch (error) {
            errorLog(`handleGetSubscriptions: ${error}`, "error");
        }
    });
    /**
     * This function is responsible to
     * fetch the purchase history
     */
    const handleGetPurchaseHistory = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield getPurchaseHistory();
            if (purchaseHistory.length > 0) {
                setAlreadyPurchased(true);
                setUserPurchase(currentPurchase ? currentPurchase : null);
            }
        }
        catch (error) {
            errorLog(`handleGetPurchaseHistory: ${error}`, "error");
        }
    });
    //   Effect to fetch IAP subscriptions + purchase history
    (0, react_1.useEffect)(() => {
        const fetchIapEssentials = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                yield handleGetSubscriptions();
                yield handleGetPurchaseHistory();
            }
            catch (error) {
                errorLog(`fetchIapEssentials: ${error}`);
            }
        });
        if (connected)
            fetchIapEssentials();
    }, [connected]);
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
                setIapticValidated(true);
            }
            else {
                console.error("Validation failed:", response.data);
                setIapticValidated(false);
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error(`handlePurchaseValidation Error: ${error.message}`);
            }
            else {
                console.error(`handlePurchaseValidation Unknown Error: ${JSON.stringify(error)}`);
            }
            setIapticValidated(false);
        }
    });
    (0, react_1.useEffect)(() => {
        const checkCurrentPurchase = () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                if (currentPurchase === null || currentPurchase === void 0 ? void 0 : currentPurchase.productId) {
                    setUserPurchase(currentPurchase);
                    yield handlePurchaseValidation(currentPurchase);
                    yield finishTransaction({
                        purchase: currentPurchase,
                        isConsumable: true,
                    });
                    yield saveValueInAsync(ASYNC_KEYS.USER_PURCHASE, JSON.stringify(currentPurchase));
                    setIapLoading(false);
                }
            }
            catch (error) {
                setIapLoading(false);
                errorLog(`checkCurrentPurchase: ${error}`, "error");
            }
        });
        checkCurrentPurchase();
    }, [currentPurchase, finishTransaction]);
    (0, react_1.useEffect)(() => {
        const checkCurrentPurchaseError = () => __awaiter(void 0, void 0, void 0, function* () {
            if (currentPurchaseError) {
                setIapLoading(false);
                errorLog(`checkCurrentPurchaseError: ${currentPurchaseError.message}`, "error");
            }
        });
        checkCurrentPurchaseError();
    }, [currentPurchaseError]);
    /**
     * Function is responsible to
     * buy a subscription
     * @param {string} productId
     * @param {string} [offerToken]
     */
    const handleBuySubscription = (productId, offerToken) => __awaiter(void 0, void 0, void 0, function* () {
        if (internal_1.isPlay && !offerToken) {
            console.warn(`There are no subscription Offers for selected product (Only requiered for Google Play purchases): ${productId}`);
        }
        try {
            setIapLoading(true);
            yield (0, react_native_iap_1.requestSubscription)(Object.assign({ sku: productId }, (offerToken && {
                subscriptionOffers: [{ sku: productId, offerToken }],
            })));
        }
        catch (error) {
            setIapLoading(false);
            errorLog(`handleBuySubscription: ${error}`, "error");
        }
    });
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
    (0, react_1.useEffect)(() => {
        return () => {
            (0, react_native_iap_1.endConnection)();
        };
    }, []);
    return (react_1.default.createElement(exports.DeepLinkIapContext.Provider, { value: {
            iapLoading,
            alreadyPurchased,
            isIapticValidated,
            subscriptions,
            userPurchase,
            referrerLink,
            userId,
            handleBuySubscription,
            trackEvent,
        } }, children));
};
exports.default = (0, react_native_iap_1.withIAPContext)(DeepLinkIapProvider);
