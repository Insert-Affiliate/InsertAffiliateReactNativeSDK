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
// Drop-in "Refer a friend" screen. Must be rendered inside DeepLinkIapProvider.
//
// States: loading -> not enrolled (email + name, "Get my link") -> code step
// when the email already belongs to an affiliate -> enrolled (code, link,
// Copy, Share, stats, free premium date, reward codes, "Open my dashboard").
// Store rules: share sheet only, no Contacts access, nothing gated behind sharing.
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const clipboard_1 = __importDefault(require("@react-native-clipboard/clipboard"));
const useDeepLinkIapProvider_1 = __importDefault(require("./useDeepLinkIapProvider"));
const referrals_1 = require("./referrals");
const DEFAULT_PRIMARY_COLOR = '#6A0DAD';
const DEFAULT_HEADLINE = 'Refer a friend';
const ERROR_MESSAGES = {
    PROGRAM_DISABLED: 'Referrals are not available in this app right now.',
    AFFILIATE_LIMIT_REACHED: 'The referral program is full right now. Please try again later.',
    INVALID_CODE: 'That code is wrong or has expired.',
    TOO_MANY_CODES: 'Too many codes requested. Please wait a while and try again.',
    RATE_LIMITED: 'Too many attempts. Please try again later.',
    INVALID_EMAIL: 'Please enter a valid email address.',
    NETWORK_ERROR: 'Could not connect. Check your connection and try again.',
};
const errorText = (result) => (result.errorCode && ERROR_MESSAGES[result.errorCode]) || 'Something went wrong. Please try again.';
const formatMoney = (amount, currency) => {
    try {
        return amount.toLocaleString(undefined, { style: 'currency', currency });
    }
    catch (_a) {
        return `${currency} ${amount.toFixed(2)}`;
    }
};
const formatDate = (iso) => {
    const date = new Date(iso);
    try {
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    }
    catch (_a) {
        return date.toDateString();
    }
};
const ReferAFriend = ({ visible, onClose, email: emailProp, name: nameProp, appUserId, playPurchaseToken, shareMessage, primaryColor: primaryColorProp, headline: headlineProp, rewardText: rewardTextProp, }) => {
    const { createAffiliateForUser, verifyAffiliateCode, setReferrerAccount, getMyAffiliateDetails, isUserAnAffiliate, getReferralProgramConfig, } = (0, useDeepLinkIapProvider_1.default)();
    const [step, setStep] = (0, react_1.useState)('loading');
    const [config, setConfig] = (0, react_1.useState)(null);
    const [affiliate, setAffiliate] = (0, react_1.useState)(null);
    const [details, setDetails] = (0, react_1.useState)(null);
    const [email, setEmail] = (0, react_1.useState)(emailProp || '');
    const [name, setName] = (0, react_1.useState)(nameProp || '');
    const [code, setCode] = (0, react_1.useState)('');
    const [busy, setBusy] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [notice, setNotice] = (0, react_1.useState)('');
    const primaryColor = primaryColorProp || (config && config.primaryColor) || DEFAULT_PRIMARY_COLOR;
    const headline = headlineProp || (config && config.headline) || DEFAULT_HEADLINE;
    const accountOptions = appUserId || playPurchaseToken ? { appUserId, playPurchaseToken } : undefined;
    const rewardText = rewardTextProp || (config && config.rewardText) || '';
    const showEnrolled = (0, react_1.useCallback)((fallback) => __awaiter(void 0, void 0, void 0, function* () {
        const loaded = yield getMyAffiliateDetails();
        if (loaded) {
            setDetails(loaded);
            setAffiliate(loaded);
            setStep('enrolled');
            return true;
        }
        if (fallback) {
            setAffiliate(fallback);
            setStep('enrolled');
            return true;
        }
        return false;
    }), [getMyAffiliateDetails]);
    (0, react_1.useEffect)(() => {
        if (!visible)
            return;
        let cancelled = false;
        setStep('loading');
        setError('');
        setNotice('');
        setCode('');
        setEmail(emailProp || '');
        setName(nameProp || '');
        (() => __awaiter(void 0, void 0, void 0, function* () {
            const [loadedConfig, enrolled] = yield Promise.all([getReferralProgramConfig(), isUserAnAffiliate()]);
            if (cancelled)
                return;
            setConfig(loadedConfig);
            // Already enrolled: save the accounts first so waiting rewards show below
            if (enrolled && accountOptions) {
                yield setReferrerAccount(accountOptions);
                if (cancelled)
                    return;
            }
            const shown = enrolled ? yield showEnrolled() : false;
            if (cancelled)
                return;
            if (!shown) {
                setDetails(null);
                setAffiliate(null);
                setStep('enrol');
            }
        }))();
        return () => {
            cancelled = true;
        };
    }, [visible]);
    const handleResult = (result) => __awaiter(void 0, void 0, void 0, function* () {
        if (result.status === 'verificationRequired') {
            setCode('');
            setNotice(`We sent a 6-digit code to ${email.trim()}.`);
            setStep('code');
            return;
        }
        if (result.status === 'created' || result.status === 'connected') {
            yield showEnrolled(result.affiliate);
            return;
        }
        setError(errorText(result));
    });
    const run = (action) => __awaiter(void 0, void 0, void 0, function* () {
        if (busy)
            return;
        setBusy(true);
        setError('');
        try {
            yield action();
        }
        finally {
            setBusy(false);
        }
    });
    const onGetLink = () => run(() => __awaiter(void 0, void 0, void 0, function* () {
        setNotice('');
        yield handleResult(yield createAffiliateForUser(email.trim(), name.trim(), accountOptions));
    }));
    const onVerify = () => run(() => __awaiter(void 0, void 0, void 0, function* () {
        yield handleResult(yield verifyAffiliateCode(email.trim(), code, name.trim(), accountOptions));
    }));
    const onResend = () => run(() => __awaiter(void 0, void 0, void 0, function* () {
        yield handleResult(yield createAffiliateForUser(email.trim(), name.trim(), accountOptions));
    }));
    const shareText = affiliate ? (0, referrals_1.buildReferralShareText)(affiliate, config ? config.companyName : '', shareMessage) : '';
    const hasLink = !!affiliate && /^http/i.test(affiliate.deeplinkurl);
    const onCopy = () => {
        if (!affiliate)
            return;
        clipboard_1.default.setString(hasLink ? affiliate.deeplinkurl : affiliate.affiliateShortCode);
        setNotice('Copied');
    };
    const onShare = () => {
        if (shareText)
            (0, referrals_1.openShareSheet)(shareText);
    };
    const onRedeem = (redeemUrl) => {
        if (redeemUrl) {
            react_native_1.Linking.openURL(redeemUrl).catch(() => { });
        }
    };
    // Only codes this phone's store can redeem (App Store on iOS, Google Play on Android).
    const rewardCodes = details ? (0, referrals_1.rewardCodesForPlatform)(details.rewardCodes, react_native_1.Platform.OS) : [];
    const onOpenDashboard = () => {
        if (details && details.dashboardUrl) {
            react_native_1.Linking.openURL(details.dashboardUrl).catch(() => { });
        }
    };
    const primaryButton = (label, onPress, disabled = false) => (react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: onPress, disabled: disabled || busy, style: ({ pressed }) => [
            styles.button,
            { backgroundColor: primaryColor, opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1 },
        ] }, busy ? react_1.default.createElement(react_native_1.ActivityIndicator, { color: "#FFFFFF" }) : react_1.default.createElement(react_native_1.Text, { style: styles.buttonText }, label)));
    const linkButton = (label, onPress) => (react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: onPress, disabled: busy, style: styles.linkButton },
        react_1.default.createElement(react_native_1.Text, { style: [styles.linkText, { color: primaryColor }] }, label)));
    const renderBody = () => {
        if (step === 'loading') {
            return react_1.default.createElement(react_native_1.ActivityIndicator, { style: styles.loading, color: primaryColor });
        }
        if (step === 'enrol') {
            if (config && !config.enabled) {
                return react_1.default.createElement(react_native_1.Text, { style: styles.rewardText }, ERROR_MESSAGES.PROGRAM_DISABLED);
            }
            return (react_1.default.createElement(react_native_1.View, null,
                react_1.default.createElement(react_native_1.Text, { style: styles.label }, "Email"),
                react_1.default.createElement(react_native_1.TextInput, { style: styles.input, value: email, onChangeText: setEmail, placeholder: "you@example.com", autoCapitalize: "none", autoCorrect: false, keyboardType: "email-address", textContentType: "emailAddress" }),
                react_1.default.createElement(react_native_1.Text, { style: styles.label }, "Name"),
                react_1.default.createElement(react_native_1.TextInput, { style: styles.input, value: name, onChangeText: setName, placeholder: "Your name", textContentType: "name" }),
                primaryButton('Get my link', onGetLink, !email.trim())));
        }
        if (step === 'code') {
            return (react_1.default.createElement(react_native_1.View, null,
                react_1.default.createElement(react_native_1.Text, { style: styles.label }, "Enter the 6-digit code"),
                react_1.default.createElement(react_native_1.TextInput, { style: [styles.input, styles.codeInput], value: code, onChangeText: (value) => setCode(value.replace(/[^0-9]/g, '').slice(0, 6)), placeholder: "123456", keyboardType: "number-pad", textContentType: "oneTimeCode", maxLength: 6 }),
                primaryButton('Verify', onVerify, code.length !== 6),
                linkButton('Send a new code', onResend),
                linkButton('Use a different email', () => { setError(''); setNotice(''); setStep('enrol'); })));
        }
        if (!affiliate)
            return null;
        return (react_1.default.createElement(react_native_1.View, null,
            react_1.default.createElement(react_native_1.Text, { style: styles.label }, "Your code"),
            react_1.default.createElement(react_native_1.Text, { style: styles.code, selectable: true }, affiliate.affiliateShortCode),
            hasLink ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(react_native_1.Text, { style: styles.label }, "Your link"),
                react_1.default.createElement(react_native_1.Text, { style: styles.link, selectable: true, numberOfLines: 2 }, affiliate.deeplinkurl))) : null,
            react_1.default.createElement(react_native_1.View, { style: styles.row },
                react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: onCopy, style: ({ pressed }) => [styles.button, styles.rowButton, styles.rowButtonSpacer, styles.outlineButton, { borderColor: primaryColor, opacity: pressed ? 0.8 : 1 }] },
                    react_1.default.createElement(react_native_1.Text, { style: [styles.buttonText, { color: primaryColor }] }, "Copy")),
                react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: onShare, style: ({ pressed }) => [styles.button, styles.rowButton, { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 }] },
                    react_1.default.createElement(react_native_1.Text, { style: styles.buttonText }, "Share"))),
            details ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(react_native_1.View, { style: styles.stats },
                    react_1.default.createElement(react_native_1.View, { style: styles.stat },
                        react_1.default.createElement(react_native_1.Text, { style: styles.statValue }, details.referralCount),
                        react_1.default.createElement(react_native_1.Text, { style: styles.statLabel }, "Referrals")),
                    react_1.default.createElement(react_native_1.View, { style: styles.stat },
                        react_1.default.createElement(react_native_1.Text, { style: styles.statValue }, formatMoney(details.totalEarned, details.currency)),
                        react_1.default.createElement(react_native_1.Text, { style: styles.statLabel }, "Earned"))),
                details.premiumUntil && (0, referrals_1.isPremiumActive)(details.premiumUntil) ? (react_1.default.createElement(react_native_1.Text, { style: styles.premium },
                    "Free premium until ",
                    formatDate(details.premiumUntil))) : null,
                rewardCodes.length > 0 ? (react_1.default.createElement(react_native_1.View, { style: styles.rewards },
                    react_1.default.createElement(react_native_1.Text, { style: styles.rewardsTitle }, "Your rewards"),
                    rewardCodes.map((reward) => (react_1.default.createElement(react_native_1.View, { key: reward.code, style: styles.rewardRow },
                        react_1.default.createElement(react_native_1.Text, { style: styles.rewardCode, selectable: true }, reward.code),
                        react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: () => onRedeem(reward.redeemUrl), disabled: !reward.redeemUrl, style: ({ pressed }) => [styles.redeemButton, { backgroundColor: primaryColor, opacity: !reward.redeemUrl ? 0.5 : pressed ? 0.8 : 1 }] },
                            react_1.default.createElement(react_native_1.Text, { style: styles.redeemText }, "Redeem"))))))) : null,
                details.dashboardUrl ? linkButton('Open my dashboard', onOpenDashboard) : null)) : null));
    };
    return (react_1.default.createElement(react_native_1.Modal, { visible: visible, animationType: "slide", transparent: true, onRequestClose: onClose },
        react_1.default.createElement(react_native_1.View, { style: styles.backdrop },
            react_1.default.createElement(react_native_1.View, { style: styles.sheet },
                react_1.default.createElement(react_native_1.ScrollView, { keyboardShouldPersistTaps: "handled" },
                    react_1.default.createElement(react_native_1.View, { style: styles.header },
                        react_1.default.createElement(react_native_1.Text, { style: styles.headline }, headline),
                        react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: "Close", onPress: onClose, hitSlop: 12 },
                            react_1.default.createElement(react_native_1.Text, { style: styles.close }, "\u2715"))),
                    rewardText ? react_1.default.createElement(react_native_1.Text, { style: styles.rewardText }, rewardText) : null,
                    notice ? react_1.default.createElement(react_native_1.Text, { style: styles.notice }, notice) : null,
                    error ? react_1.default.createElement(react_native_1.Text, { style: styles.error }, error) : null,
                    renderBody())))));
};
const styles = react_native_1.StyleSheet.create({
    backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 36, maxHeight: '90%' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
    headline: { flex: 1, fontSize: 22, fontWeight: '700', color: '#111111' },
    close: { fontSize: 18, color: '#666666', paddingLeft: 12 },
    rewardText: { fontSize: 15, color: '#444444', marginBottom: 12 },
    notice: { fontSize: 14, color: '#2E7D32', marginBottom: 8 },
    error: { fontSize: 14, color: '#C62828', marginBottom: 8 },
    loading: { marginVertical: 32 },
    label: { fontSize: 13, color: '#666666', marginTop: 12, marginBottom: 4 },
    input: { borderWidth: 1, borderColor: '#DDDDDD', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, color: '#111111' },
    codeInput: { fontSize: 22, letterSpacing: 6, textAlign: 'center' },
    button: { borderRadius: 10, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    outlineButton: { backgroundColor: 'transparent', borderWidth: 1.5 },
    row: { flexDirection: 'row' },
    rowButton: { flex: 1 },
    rowButtonSpacer: { marginRight: 12 },
    linkButton: { alignItems: 'center', paddingVertical: 12 },
    linkText: { fontSize: 15, fontWeight: '600' },
    code: { fontSize: 24, fontWeight: '700', letterSpacing: 2, color: '#111111' },
    link: { fontSize: 14, color: '#333333' },
    stats: { flexDirection: 'row', marginTop: 20, borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 16 },
    stat: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '700', color: '#111111' },
    statLabel: { fontSize: 13, color: '#666666', marginTop: 2 },
    premium: { fontSize: 15, fontWeight: '600', color: '#2E7D32', textAlign: 'center', marginTop: 16 },
    rewards: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#EEEEEE', paddingTop: 16 },
    rewardsTitle: { fontSize: 16, fontWeight: '700', color: '#111111', marginBottom: 8 },
    rewardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    rewardCode: { flex: 1, fontSize: 16, fontWeight: '600', letterSpacing: 1, color: '#111111', marginRight: 12 },
    redeemButton: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 16 },
    redeemText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
exports.default = ReferAFriend;
