"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = require("react");
const DeepLinkIapProvider_1 = require("./DeepLinkIapProvider");
const useDeepLinkIapProvider = () => {
    const { alreadyPurchased, handleBuySubscription, iapLoading, referrerLink, isIapticValidated, subscriptions, userId, userPurchase, trackEvent, } = (0, react_1.useContext)(DeepLinkIapProvider_1.DeepLinkIapContext);
    return {
        alreadyPurchased,
        handleBuySubscription,
        iapLoading,
        referrerLink,
        subscriptions,
        userId,
        isIapticValidated,
        userPurchase,
        trackEvent
    };
};
exports.default = useDeepLinkIapProvider;
