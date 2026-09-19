"use strict";
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
exports.openShareSheet = exports.shareReferralLink = exports.getReferralProgramConfig = exports.signOutAffiliate = exports.isUserAnAffiliate = exports.setReferrerAccount = exports.getMyAffiliateDetails = exports.verifyAffiliateCode = exports.createAffiliateForUser = exports.buildReferralShareText = exports.parseEnrolResponse = exports.parseReferralProgramConfig = exports.parseMyAffiliateDetails = exports.isPremiumActive = exports.parseRewardCodes = exports.parseReferrerAffiliate = void 0;
// In-app referrals: turn the app's own user into an affiliate, read their
// referral stats and share their link. Backend: /V1/sdk/affiliate.
//
// The company ID is public (it ships in every app binary), so reading the
// user's own stats needs the device token issued on enrol/verify. The token is
// stored per company ID in AsyncStorage and is never logged.
const react_native_1 = require("react-native");
const axios_1 = __importDefault(require("axios"));
const async_storage_1 = __importDefault(require("@react-native-async-storage/async-storage"));
const API_BASE = 'https://api.insertaffiliate.com/V1/sdk/affiliate';
const TOKEN_HEADER = 'X-Insert-Affiliate-Token';
const TOKEN_KEY_PREFIX = '@app_referrer_token_';
const PLATFORM = 'react-native';
// PARSING
const asString = (value) => (typeof value === 'string' ? value : '');
const asNumber = (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
};
const asNullableString = (value) => typeof value === 'string' && value ? value : null;
const asTrigger = (value) => value === 'install' || value === 'event' ? value : 'purchase';
const parseReferrerAffiliate = (data) => ({
    affiliateName: asString(data && data.affiliateName),
    affiliateShortCode: asString(data && data.affiliateShortCode),
    deeplinkurl: asString(data && data.deeplinkurl),
});
exports.parseReferrerAffiliate = parseReferrerAffiliate;
const parseRewardCodes = (value) => Array.isArray(value)
    ? value
        .filter((item) => item && asString(item.code))
        .map((item) => ({
        code: asString(item.code),
        redeemUrl: asString(item.redeemUrl),
        grantedAt: asNullableString(item.grantedAt),
    }))
    : [];
exports.parseRewardCodes = parseRewardCodes;
// True when premiumUntil is a valid date later than now.
const isPremiumActive = (premiumUntil, now = Date.now()) => {
    if (!premiumUntil)
        return false;
    const time = Date.parse(premiumUntil);
    return Number.isFinite(time) && time > now;
};
exports.isPremiumActive = isPremiumActive;
const parseMyAffiliateDetails = (data) => (Object.assign(Object.assign({}, (0, exports.parseReferrerAffiliate)(data)), { referralTrigger: asTrigger(data && data.referralTrigger), referralCount: asNumber(data && data.referralCount), installCount: asNumber(data && data.installCount), eventCount: asNumber(data && data.eventCount), purchaseCount: asNumber(data && data.purchaseCount), totalEarned: asNumber(data && data.totalEarned), totalPaid: asNumber(data && data.totalPaid), totalUnpaid: asNumber(data && data.totalUnpaid), currency: asString(data && data.currency) || 'USD', dashboardUrl: asString(data && data.dashboardUrl), rewardsGranted: asNumber(data && data.rewardsGranted), premiumUntil: asNullableString(data && data.premiumUntil), rewardCodes: (0, exports.parseRewardCodes)(data && data.rewardCodes) }));
exports.parseMyAffiliateDetails = parseMyAffiliateDetails;
const parseReferralProgramConfig = (data) => ({
    enabled: !!data && data.enabled === true,
    companyName: asString(data && data.companyName),
    referralTrigger: asTrigger(data && data.referralTrigger),
    headline: asString(data && data.headline),
    rewardText: asString(data && data.rewardText),
    primaryColor: asString(data && data.primaryColor),
});
exports.parseReferralProgramConfig = parseReferralProgramConfig;
// Turns an enrol/verify HTTP response into the public result. `token` is
// returned separately so callers can store it without it reaching the result.
const parseEnrolResponse = (httpStatus, data) => {
    if (httpStatus >= 200 && httpStatus < 300 && data) {
        if (data.status === 'verificationRequired') {
            return { result: { status: 'verificationRequired' }, token: null };
        }
        const token = asString(data.token);
        if ((data.status === 'created' || data.status === 'connected') && token) {
            return {
                result: { status: data.status, affiliate: (0, exports.parseReferrerAffiliate)(data.affiliate) },
                token,
            };
        }
    }
    return {
        result: {
            status: 'error',
            errorCode: asString(data && data.code) || (httpStatus >= 200 && httpStatus < 300 ? 'INVALID_RESPONSE' : `HTTP_${httpStatus}`),
            errorMessage: asString(data && data.error) || 'Unexpected response from the server.',
        },
        token: null,
    };
};
exports.parseEnrolResponse = parseEnrolResponse;
// SHARE TEXT
// Links starting with http are shared as "<message> <link>" (default message
// "Try {companyName}:"). Short Code Only companies have no link, so the code
// itself is shared. An app message may use {link} and {code} placeholders.
const buildReferralShareText = (affiliate, companyName, message) => {
    const code = affiliate.affiliateShortCode;
    const link = /^http/i.test(affiliate.deeplinkurl) ? affiliate.deeplinkurl : '';
    const appName = companyName || 'the app';
    const custom = (message || '').trim();
    if (custom) {
        if (/\{link\}|\{code\}/.test(custom)) {
            return custom.split('{link}').join(link || code).split('{code}').join(code);
        }
        return `${custom} ${link || code}`;
    }
    if (link) {
        return `Try ${appName}: ${link}`;
    }
    return `Use my code ${code} in ${appName}`;
};
exports.buildReferralShareText = buildReferralShareText;
// TOKEN STORAGE
const tokenKey = (companyId) => `${TOKEN_KEY_PREFIX}${companyId}`;
const readToken = (companyId) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield async_storage_1.default.getItem(tokenKey(companyId));
    }
    catch (_a) {
        return null;
    }
});
const saveToken = (companyId, token) => __awaiter(void 0, void 0, void 0, function* () {
    yield async_storage_1.default.setItem(tokenKey(companyId), token);
});
const clearToken = (companyId) => __awaiter(void 0, void 0, void 0, function* () {
    yield async_storage_1.default.removeItem(tokenKey(companyId));
});
// Accept every status so error bodies ({ error, code }) can be read.
const requestOptions = (headers = {}) => ({
    headers: Object.assign({ 'Content-Type': 'application/json' }, headers),
    validateStatus: () => true,
});
const notInitialized = () => ({
    status: 'error',
    errorCode: 'NOT_INITIALIZED',
    errorMessage: 'Call initialize with your company code first.',
});
const networkError = () => ({
    status: 'error',
    errorCode: 'NETWORK_ERROR',
    errorMessage: 'Could not reach Insert Affiliate.',
});
// The device id plus any app-supplied accounts, with empty values left out.
const identityBody = (deps, options) => __awaiter(void 0, void 0, void 0, function* () {
    const body = {};
    let deviceId = null;
    try {
        deviceId = yield deps.getDeviceId();
    }
    catch (error) {
        deps.errorLog('Error reading device id for referrer:', error);
    }
    if (deviceId)
        body.deviceId = deviceId;
    const appUserId = ((options && options.appUserId) || '').trim();
    const playPurchaseToken = ((options && options.playPurchaseToken) || '').trim();
    if (appUserId)
        body.appUserId = appUserId;
    if (playPurchaseToken)
        body.playPurchaseToken = playPurchaseToken;
    return body;
});
const postEnrolment = (deps, path, body, options) => __awaiter(void 0, void 0, void 0, function* () {
    const companyId = yield deps.getCompanyId();
    if (!companyId) {
        deps.verboseLog(`Cannot ${path} referrer: no company code available`);
        return notInitialized();
    }
    try {
        const response = yield axios_1.default.post(`${API_BASE}/${path}`, Object.assign(Object.assign(Object.assign({}, body), (yield identityBody(deps, options))), { companyId, platform: PLATFORM }), requestOptions());
        const { result, token } = (0, exports.parseEnrolResponse)(response.status, response.data);
        if (token) {
            yield saveToken(companyId, token);
        }
        deps.verboseLog(`Referrer ${path} result: ${result.status}${result.errorCode ? ` (${result.errorCode})` : ''}`);
        return result;
    }
    catch (error) {
        deps.errorLog(`Referrer ${path} failed:`, error);
        return networkError();
    }
});
// PUBLIC METHODS (wrapped by the provider)
const createAffiliateForUser = (deps, email, name, options) => postEnrolment(deps, 'enrol', { email: (email || '').trim(), name: name || '' }, options);
exports.createAffiliateForUser = createAffiliateForUser;
const verifyAffiliateCode = (deps, email, code, name, options) => postEnrolment(deps, 'verify', {
    email: (email || '').trim(),
    code: (code || '').replace(/\s/g, ''),
    name: name || '',
}, options);
exports.verifyAffiliateCode = verifyAffiliateCode;
const getMyAffiliateDetails = (deps) => __awaiter(void 0, void 0, void 0, function* () {
    const companyId = yield deps.getCompanyId();
    if (!companyId) {
        deps.verboseLog('Cannot get referrer details: no company code available');
        return null;
    }
    const token = yield readToken(companyId);
    if (!token) {
        deps.verboseLog('No referrer token stored; user is not an affiliate on this device');
        return null;
    }
    try {
        const response = yield axios_1.default.get(`${API_BASE}/me`, requestOptions({ [TOKEN_HEADER]: token }));
        if (response.status === 401 || response.status === 404) {
            deps.verboseLog(`Referrer token rejected (${response.status}); clearing it`);
            yield clearToken(companyId);
            return null;
        }
        if (response.status !== 200 || !response.data) {
            deps.verboseLog(`Referrer details request failed with status ${response.status}`);
            return null;
        }
        return (0, exports.parseMyAffiliateDetails)(response.data);
    }
    catch (error) {
        deps.errorLog('Error getting referrer details:', error);
        return null;
    }
});
exports.getMyAffiliateDetails = getMyAffiliateDetails;
// Saves the referrer's app accounts after they joined (for users who subscribe
// or log in later). The server then grants any rewards that were waiting.
const setReferrerAccount = (deps, options) => __awaiter(void 0, void 0, void 0, function* () {
    const companyId = yield deps.getCompanyId();
    if (!companyId) {
        deps.verboseLog('Cannot set referrer account: no company code available');
        return false;
    }
    const token = yield readToken(companyId);
    if (!token) {
        deps.verboseLog('No referrer token stored; user is not an affiliate on this device');
        return false;
    }
    try {
        const response = yield axios_1.default.post(`${API_BASE}/me/identity`, yield identityBody(deps, options), requestOptions({ [TOKEN_HEADER]: token }));
        if (response.status === 401 || response.status === 404) {
            deps.verboseLog(`Referrer token rejected (${response.status}); clearing it`);
            yield clearToken(companyId);
            return false;
        }
        const saved = response.status === 200 && !!response.data && response.data.saved === true;
        deps.verboseLog(saved ? 'Referrer account saved' : `Referrer account request failed with status ${response.status}`);
        return saved;
    }
    catch (error) {
        deps.errorLog('Error setting referrer account:', error);
        return false;
    }
});
exports.setReferrerAccount = setReferrerAccount;
const isUserAnAffiliate = (deps) => __awaiter(void 0, void 0, void 0, function* () {
    const companyId = yield deps.getCompanyId();
    if (!companyId)
        return false;
    return !!(yield readToken(companyId));
});
exports.isUserAnAffiliate = isUserAnAffiliate;
const signOutAffiliate = (deps) => __awaiter(void 0, void 0, void 0, function* () {
    const companyId = yield deps.getCompanyId();
    if (!companyId)
        return;
    yield clearToken(companyId);
    deps.verboseLog('Referrer signed out on this device');
});
exports.signOutAffiliate = signOutAffiliate;
const getReferralProgramConfig = (deps) => __awaiter(void 0, void 0, void 0, function* () {
    const companyId = yield deps.getCompanyId();
    if (!companyId) {
        deps.verboseLog('Cannot get referral program config: no company code available');
        return null;
    }
    try {
        const response = yield axios_1.default.get(`${API_BASE}/config/${encodeURIComponent(companyId)}`, requestOptions());
        if (response.status !== 200 || !response.data) {
            deps.verboseLog(`Referral program config request failed with status ${response.status}`);
            return null;
        }
        return (0, exports.parseReferralProgramConfig)(response.data);
    }
    catch (error) {
        deps.errorLog('Error getting referral program config:', error);
        return null;
    }
});
exports.getReferralProgramConfig = getReferralProgramConfig;
// Opens the system share sheet. Returns false when the user is not an
// affiliate on this device or the details could not be loaded.
const shareReferralLink = (deps, message) => __awaiter(void 0, void 0, void 0, function* () {
    const [details, config] = yield Promise.all([(0, exports.getMyAffiliateDetails)(deps), (0, exports.getReferralProgramConfig)(deps)]);
    if (!details) {
        deps.verboseLog('Cannot share referral link: no referrer details');
        return false;
    }
    return (0, exports.openShareSheet)((0, exports.buildReferralShareText)(details, config ? config.companyName : '', message), deps);
});
exports.shareReferralLink = shareReferralLink;
const openShareSheet = (text, deps) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield react_native_1.Share.share({ message: text });
        return true;
    }
    catch (error) {
        if (deps)
            deps.errorLog('Error opening share sheet:', error);
        return false;
    }
});
exports.openShareSheet = openShareSheet;
