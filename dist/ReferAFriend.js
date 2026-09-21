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
// A connected device whose details cannot be loaded (offline, server error)
// shows "Try again" instead of the sign-up form.
// Store rules: share sheet only, no Contacts access, nothing gated behind sharing.
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const clipboard_1 = __importDefault(require("@react-native-clipboard/clipboard"));
const useDeepLinkIapProvider_1 = __importDefault(require("./useDeepLinkIapProvider"));
const referralStrings_1 = require("./referralStrings");
const referrals_1 = require("./referrals");
const DEFAULT_PRIMARY_COLOR = '#6A0DAD';
const DEFAULT_HEADLINE = 'Refer a friend';
const errorStringKey = (result) => (result.errorCode && referralStrings_1.REFERRAL_ERROR_STRING_KEYS[result.errorCode]) || 'errorServer';
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
const ReferAFriend = ({ visible, onClose, email: emailProp, name: nameProp, appUserId, playPurchaseToken, shareMessage, primaryColor: primaryColorProp, headline: headlineProp, rewardText: rewardTextProp, strings, fontFamily, cornerRadius, }) => {
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
    // The app's label for a key, or the English default.
    const t = (key) => (0, referralStrings_1.referralString)(strings, key);
    const errorText = (result) => t(errorStringKey(result));
    // The app's font goes on every label, and cornerRadius (0 and up) on the
    // sheet, the fields and the buttons.
    const fontStyle = fontFamily ? { fontFamily } : null;
    const radius = typeof cornerRadius === 'number' && Number.isFinite(cornerRadius) && cornerRadius >= 0 ? cornerRadius : null;
    const controlRadius = radius === null ? null : { borderRadius: radius };
    const sheetRadius = radius === null ? null : { borderTopLeftRadius: radius, borderTopRightRadius: radius };
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
    // Each load gets an id; a load that is no longer the latest (the screen was
    // closed or reopened, or "Try again" was pressed) stops without updating.
    const loadIdRef = (0, react_1.useRef)(0);
    // Never rejects: an unexpected error shows the "Try again" step.
    const load = () => __awaiter(void 0, void 0, void 0, function* () {
        const loadId = ++loadIdRef.current;
        const isCurrent = () => loadIdRef.current === loadId;
        setStep('loading');
        setError('');
        try {
            yield loadSteps(isCurrent);
        }
        catch (_a) {
            if (isCurrent())
                setStep('failed');
        }
    });
    const loadSteps = (isCurrent) => __awaiter(void 0, void 0, void 0, function* () {
        const showEnrol = () => {
            setDetails(null);
            setAffiliate(null);
            setStep('enrol');
        };
        const [loadedConfig, enrolled] = yield Promise.all([getReferralProgramConfig(), isUserAnAffiliate()]);
        if (!isCurrent())
            return;
        setConfig(loadedConfig);
        if (!enrolled) {
            showEnrol();
            return;
        }
        // Already enrolled: save the accounts first so waiting rewards show below
        if (accountOptions) {
            yield setReferrerAccount(accountOptions);
            if (!isCurrent())
                return;
        }
        const loaded = yield getMyAffiliateDetails();
        if (!isCurrent())
            return;
        if (loaded) {
            setDetails(loaded);
            setAffiliate(loaded);
            setStep('enrolled');
            return;
        }
        // Only a device whose token is gone (signed out, or rejected by the
        // server) goes back to the sign-up form.
        const stillEnrolled = yield isUserAnAffiliate();
        if (!isCurrent())
            return;
        if (stillEnrolled) {
            setStep('failed');
        }
        else {
            showEnrol();
        }
    });
    (0, react_1.useEffect)(() => {
        if (!visible)
            return;
        setNotice('');
        setCode('');
        setEmail(emailProp || '');
        setName(nameProp || '');
        load();
        return () => {
            loadIdRef.current += 1;
        };
    }, [visible]);
    // noticeKey is the text shown once a code is on its way: the first one, or
    // the one "Send a new code" asked for.
    const handleResult = (result_1, ...args_1) => __awaiter(void 0, [result_1, ...args_1], void 0, function* (result, noticeKey = 'codeSentNotice') {
        if (result.status === 'verificationRequired') {
            setCode('');
            setNotice((0, referralStrings_1.formatReferralString)(t(noticeKey), { email: email.trim() }));
            setStep('code');
            return;
        }
        if (result.status === 'created' || result.status === 'connected') {
            yield showEnrolled(result.affiliate);
            return;
        }
        setError(errorText(result));
    });
    // A ref, not the busy state, guards submits: two taps in the same frame both
    // see the same busy value, but the ref changes at once.
    const submittingRef = (0, react_1.useRef)(false);
    const run = (action) => __awaiter(void 0, void 0, void 0, function* () {
        if (submittingRef.current)
            return;
        submittingRef.current = true;
        setBusy(true);
        setError('');
        try {
            yield action();
        }
        catch (_a) {
            setError(errorText({ status: 'error' }));
        }
        finally {
            submittingRef.current = false;
            setBusy(false);
        }
    });
    const onRetry = () => {
        setNotice('');
        load();
    };
    const onGetLink = () => run(() => __awaiter(void 0, void 0, void 0, function* () {
        setNotice('');
        yield handleResult(yield createAffiliateForUser(email.trim(), name.trim(), accountOptions));
    }));
    const onVerify = () => run(() => __awaiter(void 0, void 0, void 0, function* () {
        yield handleResult(yield verifyAffiliateCode(email.trim(), code, name.trim(), accountOptions));
    }));
    const onResend = () => run(() => __awaiter(void 0, void 0, void 0, function* () {
        yield handleResult(yield createAffiliateForUser(email.trim(), name.trim(), accountOptions), 'codeResentNotice');
    }));
    const shareText = affiliate ? (0, referrals_1.buildReferralShareText)(affiliate, config ? config.companyName : '', shareMessage) : '';
    const hasLink = !!affiliate && /^http/i.test(affiliate.deeplinkurl);
    const onCopy = () => {
        if (!affiliate)
            return;
        clipboard_1.default.setString(hasLink ? affiliate.deeplinkurl : affiliate.affiliateShortCode);
        setNotice(t('copiedNotice'));
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
            controlRadius,
            { backgroundColor: primaryColor, opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1 },
        ] }, busy ? react_1.default.createElement(react_native_1.ActivityIndicator, { color: "#FFFFFF" }) : react_1.default.createElement(react_native_1.Text, { style: [styles.buttonText, fontStyle] }, label)));
    const linkButton = (label, onPress) => (react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: onPress, disabled: busy, style: styles.linkButton },
        react_1.default.createElement(react_native_1.Text, { style: [styles.linkText, { color: primaryColor }, fontStyle] }, label)));
    const renderBody = () => {
        if (step === 'loading') {
            return react_1.default.createElement(react_native_1.ActivityIndicator, { style: styles.loading, color: primaryColor });
        }
        if (step === 'failed') {
            return (react_1.default.createElement(react_native_1.View, null,
                react_1.default.createElement(react_native_1.Text, { style: [styles.rewardText, fontStyle] }, t('loadFailed')),
                primaryButton(t('tryAgainButton'), onRetry)));
        }
        if (step === 'enrol') {
            if (config && !config.enabled) {
                return react_1.default.createElement(react_native_1.Text, { style: [styles.rewardText, fontStyle] }, t('errorProgramDisabled'));
            }
            return (react_1.default.createElement(react_native_1.View, null,
                react_1.default.createElement(react_native_1.Text, { style: [styles.label, fontStyle] }, t('emailLabel')),
                react_1.default.createElement(react_native_1.TextInput, { style: [styles.input, controlRadius, fontStyle], value: email, onChangeText: setEmail, placeholder: t('emailPlaceholder'), autoCapitalize: "none", autoCorrect: false, keyboardType: "email-address", textContentType: "emailAddress" }),
                react_1.default.createElement(react_native_1.Text, { style: [styles.label, fontStyle] }, t('nameLabel')),
                react_1.default.createElement(react_native_1.TextInput, { style: [styles.input, controlRadius, fontStyle], value: name, onChangeText: setName, placeholder: t('namePlaceholder'), textContentType: "name" }),
                primaryButton(t('joinButton'), onGetLink, !email.trim())));
        }
        if (step === 'code') {
            return (react_1.default.createElement(react_native_1.View, null,
                react_1.default.createElement(react_native_1.Text, { style: [styles.label, fontStyle] }, t('codeLabel')),
                react_1.default.createElement(react_native_1.TextInput, { style: [styles.input, styles.codeInput, controlRadius, fontStyle], value: code, onChangeText: (value) => setCode((0, referrals_1.normalizeVerificationCode)(value).slice(0, 6)), placeholder: t('codePlaceholder'), keyboardType: "number-pad", textContentType: "oneTimeCode" }),
                primaryButton(t('verifyButton'), onVerify, code.length !== 6),
                linkButton(t('resendButton'), onResend),
                linkButton(t('differentEmailButton'), () => { setError(''); setNotice(''); setStep('enrol'); })));
        }
        if (!affiliate)
            return null;
        return (react_1.default.createElement(react_native_1.View, null,
            react_1.default.createElement(react_native_1.Text, { style: [styles.label, fontStyle] }, t('codeLabelTitle')),
            react_1.default.createElement(react_native_1.Text, { style: [styles.code, fontStyle], selectable: true }, affiliate.affiliateShortCode),
            hasLink ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(react_native_1.Text, { style: [styles.label, fontStyle] }, t('linkLabelTitle')),
                react_1.default.createElement(react_native_1.Text, { style: [styles.link, fontStyle], selectable: true, numberOfLines: 2 }, affiliate.deeplinkurl))) : null,
            react_1.default.createElement(react_native_1.View, { style: styles.row },
                react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: onCopy, style: ({ pressed }) => [styles.button, styles.rowButton, styles.rowButtonSpacer, styles.outlineButton, controlRadius, { borderColor: primaryColor, opacity: pressed ? 0.8 : 1 }] },
                    react_1.default.createElement(react_native_1.Text, { style: [styles.buttonText, { color: primaryColor }, fontStyle] }, t('copyButton'))),
                react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: onShare, style: ({ pressed }) => [styles.button, styles.rowButton, controlRadius, { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 }] },
                    react_1.default.createElement(react_native_1.Text, { style: [styles.buttonText, fontStyle] }, t('shareButton')))),
            details ? (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(react_native_1.View, { style: styles.stats },
                    react_1.default.createElement(react_native_1.View, { style: styles.stat },
                        react_1.default.createElement(react_native_1.Text, { style: [styles.statValue, fontStyle] }, details.referralCount),
                        react_1.default.createElement(react_native_1.Text, { style: [styles.statLabel, fontStyle] }, t('referralsLabel'))),
                    react_1.default.createElement(react_native_1.View, { style: styles.stat },
                        react_1.default.createElement(react_native_1.Text, { style: [styles.statValue, fontStyle] }, formatMoney(details.totalEarned, details.currency)),
                        react_1.default.createElement(react_native_1.Text, { style: [styles.statLabel, fontStyle] }, t('earnedLabel')))),
                details.premiumUntil && (0, referrals_1.isPremiumActive)(details.premiumUntil) ? (react_1.default.createElement(react_native_1.Text, { style: [styles.premium, fontStyle] }, (0, referralStrings_1.formatReferralString)(t('premiumUntil'), { date: formatDate(details.premiumUntil) }))) : null,
                rewardCodes.length > 0 ? (react_1.default.createElement(react_native_1.View, { style: styles.rewards },
                    react_1.default.createElement(react_native_1.Text, { style: [styles.rewardsTitle, fontStyle] }, t('rewardsHeading')),
                    rewardCodes.map((reward) => (react_1.default.createElement(react_native_1.View, { key: reward.code, style: styles.rewardRow },
                        react_1.default.createElement(react_native_1.Text, { style: [styles.rewardCode, fontStyle], selectable: true }, reward.code),
                        react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", onPress: () => onRedeem(reward.redeemUrl), disabled: !reward.redeemUrl, style: ({ pressed }) => [styles.redeemButton, controlRadius, { backgroundColor: primaryColor, opacity: !reward.redeemUrl ? 0.5 : pressed ? 0.8 : 1 }] },
                            react_1.default.createElement(react_native_1.Text, { style: [styles.redeemText, fontStyle] }, t('redeemButton')))))))) : null,
                details.dashboardUrl ? linkButton(t('dashboardLink'), onOpenDashboard) : null)) : null));
    };
    return (react_1.default.createElement(react_native_1.Modal, { visible: visible, animationType: "slide", transparent: true, onRequestClose: onClose },
        react_1.default.createElement(react_native_1.View, { style: styles.backdrop },
            react_1.default.createElement(react_native_1.View, { style: [styles.sheet, sheetRadius] },
                react_1.default.createElement(react_native_1.ScrollView, { keyboardShouldPersistTaps: "handled" },
                    react_1.default.createElement(react_native_1.View, { style: styles.header },
                        react_1.default.createElement(react_native_1.Text, { style: [styles.headline, fontStyle] }, headline),
                        react_1.default.createElement(react_native_1.Pressable, { accessibilityRole: "button", accessibilityLabel: t('closeButton'), onPress: onClose, hitSlop: 12 },
                            react_1.default.createElement(react_native_1.Text, { style: [styles.close, fontStyle] }, "\u2715"))),
                    rewardText ? react_1.default.createElement(react_native_1.Text, { style: [styles.rewardText, fontStyle] }, rewardText) : null,
                    notice ? react_1.default.createElement(react_native_1.Text, { style: [styles.notice, fontStyle] }, notice) : null,
                    error ? react_1.default.createElement(react_native_1.Text, { style: [styles.error, fontStyle] }, error) : null,
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
