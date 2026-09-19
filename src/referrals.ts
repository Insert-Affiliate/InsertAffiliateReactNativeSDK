// In-app referrals: turn the app's own user into an affiliate, read their
// referral stats and share their link. Backend: /V1/sdk/affiliate.
//
// The company ID is public (it ships in every app binary), so reading the
// user's own stats needs the device token issued on enrol/verify. The token is
// stored per company ID in AsyncStorage and is never logged.
import { Platform, Share } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://api.insertaffiliate.com/V1/sdk/affiliate';
const TOKEN_HEADER = 'X-Insert-Affiliate-Token';
const TOKEN_KEY_PREFIX = '@app_referrer_token_';
const PLATFORM = 'react-native';

// TYPES
export type ReferrerAffiliate = {
  affiliateName: string;
  affiliateShortCode: string;
  deeplinkurl: string;
};

export type ReferralTrigger = 'install' | 'event' | 'purchase';

// Which store a reward code is redeemed in. Other values from newer servers are kept as-is.
export type ReferralRewardStore = 'app_store' | 'google_play' | (string & {});

// A reward code granted to the referrer: an App Store one-time offer code, or
// a Google Play promo code if they were rewarded on an Android phone.
export type ReferralRewardCode = {
  code: string;
  redeemUrl: string;
  // Missing on older servers, where every code is an App Store code.
  store: ReferralRewardStore;
  grantedAt: string | null;
};

// The referrer's own accounts, so the server can grant rewards to them and
// skip self-referrals. appUserId is the RevenueCat app user id or Adapty
// customer user id; playPurchaseToken is their own Google Play subscription
// purchase token (Android).
export type ReferrerAccountOptions = {
  appUserId?: string;
  playPurchaseToken?: string;
};

export type MyAffiliateDetails = ReferrerAffiliate & {
  referralTrigger: ReferralTrigger;
  referralCount: number;
  installCount: number;
  eventCount: number;
  purchaseCount: number;
  totalEarned: number;
  totalPaid: number;
  totalUnpaid: number;
  currency: string;
  dashboardUrl: string;
  rewardsGranted: number;
  premiumUntil: string | null;
  rewardCodes: ReferralRewardCode[];
};

export type ReferralProgramConfig = {
  enabled: boolean;
  companyName: string;
  referralTrigger: ReferralTrigger;
  headline: string;
  rewardText: string;
  primaryColor: string;
};

export type ReferralEnrolStatus = 'created' | 'connected' | 'verificationRequired' | 'error';

// Server error codes plus NETWORK_ERROR and NOT_INITIALIZED from the SDK.
export type ReferralErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_COMPANY_ID'
  | 'INVALID_CODE'
  | 'PROGRAM_DISABLED'
  | 'AFFILIATE_LIMIT_REACHED'
  | 'COMPANY_NOT_FOUND'
  | 'TOO_MANY_CODES'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'NOT_INITIALIZED'
  | string;

export type ReferralEnrolResult = {
  status: ReferralEnrolStatus;
  affiliate?: ReferrerAffiliate;
  errorCode?: ReferralErrorCode;
  errorMessage?: string;
};

// What the provider hands in: the active company ID, the device id used in the
// insert affiliate identifier ("{shortCode}-{deviceId}") and its loggers.
export type ReferralDeps = {
  getCompanyId: () => Promise<string | null>;
  getDeviceId: () => Promise<string | null>;
  verboseLog: (message: string) => void;
  // Takes text only: errors are passed through describeError first.
  errorLog: (message: string) => void;
};

// PARSING
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asNumber = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const asNullableString = (value: unknown): string | null =>
  typeof value === 'string' && value ? value : null;

const asTrigger = (value: unknown): ReferralTrigger =>
  value === 'install' || value === 'event' ? value : 'purchase';

export const parseReferrerAffiliate = (data: any): ReferrerAffiliate => ({
  affiliateName: asString(data && data.affiliateName),
  affiliateShortCode: asString(data && data.affiliateShortCode),
  deeplinkurl: asString(data && data.deeplinkurl),
});

export const parseRewardCodes = (value: unknown): ReferralRewardCode[] =>
  Array.isArray(value)
    ? value
        .filter((item) => item && asString(item.code))
        .map((item) => ({
          code: asString(item.code),
          redeemUrl: asString(item.redeemUrl),
          store: asString(item.store).trim() || 'app_store',
          grantedAt: asNullableString(item.grantedAt),
        }))
    : [];

// The codes that can be redeemed on this phone: App Store codes on iOS, Google
// Play codes on Android, everything elsewhere.
export const rewardCodesForPlatform = (codes: ReferralRewardCode[], os: string): ReferralRewardCode[] => {
  if (os === 'ios') return codes.filter((c) => c.store === 'app_store');
  if (os === 'android') return codes.filter((c) => c.store === 'google_play');
  return codes;
};

// True when premiumUntil is a valid date later than now.
export const isPremiumActive = (premiumUntil: string | null, now: number = Date.now()): boolean => {
  if (!premiumUntil) return false;
  const time = Date.parse(premiumUntil);
  return Number.isFinite(time) && time > now;
};

export const parseMyAffiliateDetails = (data: any): MyAffiliateDetails => ({
  ...parseReferrerAffiliate(data),
  referralTrigger: asTrigger(data && data.referralTrigger),
  referralCount: asNumber(data && data.referralCount),
  installCount: asNumber(data && data.installCount),
  eventCount: asNumber(data && data.eventCount),
  purchaseCount: asNumber(data && data.purchaseCount),
  totalEarned: asNumber(data && data.totalEarned),
  totalPaid: asNumber(data && data.totalPaid),
  totalUnpaid: asNumber(data && data.totalUnpaid),
  currency: asString(data && data.currency) || 'USD',
  dashboardUrl: asString(data && data.dashboardUrl),
  rewardsGranted: asNumber(data && data.rewardsGranted),
  premiumUntil: asNullableString(data && data.premiumUntil),
  rewardCodes: parseRewardCodes(data && data.rewardCodes),
});

export const parseReferralProgramConfig = (data: any): ReferralProgramConfig => ({
  enabled: !!data && data.enabled === true,
  companyName: asString(data && data.companyName),
  referralTrigger: asTrigger(data && data.referralTrigger),
  headline: asString(data && data.headline),
  rewardText: asString(data && data.rewardText),
  primaryColor: asString(data && data.primaryColor),
});

// Turns an enrol/verify HTTP response into the public result. `token` is
// returned separately so callers can store it without it reaching the result.
export const parseEnrolResponse = (
  httpStatus: number,
  data: any
): { result: ReferralEnrolResult; token: string | null } => {
  if (httpStatus >= 200 && httpStatus < 300 && data) {
    if (data.status === 'verificationRequired') {
      return { result: { status: 'verificationRequired' }, token: null };
    }
    const token = asString(data.token);
    if ((data.status === 'created' || data.status === 'connected') && token) {
      return {
        result: { status: data.status, affiliate: parseReferrerAffiliate(data.affiliate) },
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

// VERIFICATION CODE
// The code point of digit zero for every run of Unicode decimal digits
// (general category Nd, Unicode 16): each run holds the digits 0 to 9 in order.
// A table rather than a \p{Nd} regex, so it works on every JS engine.
const DIGIT_ZEROS = [
  0x30, 0x660, 0x6F0, 0x7C0, 0x966, 0x9E6, 0xA66, 0xAE6, 0xB66, 0xBE6,
  0xC66, 0xCE6, 0xD66, 0xDE6, 0xE50, 0xED0, 0xF20, 0x1040, 0x1090, 0x17E0,
  0x1810, 0x1946, 0x19D0, 0x1A80, 0x1A90, 0x1B50, 0x1BB0, 0x1C40, 0x1C50, 0xA620,
  0xA8D0, 0xA900, 0xA9D0, 0xA9F0, 0xAA50, 0xABF0, 0xFF10, 0x104A0, 0x10D30, 0x10D40,
  0x11066, 0x110F0, 0x11136, 0x111D0, 0x112F0, 0x11450, 0x114D0, 0x11650, 0x116C0, 0x116D0,
  0x116DA, 0x11730, 0x118E0, 0x11950, 0x11BF0, 0x11C50, 0x11D50, 0x11DA0, 0x11F50, 0x16130,
  0x16A60, 0x16AC0, 0x16B50, 0x16D70, 0x1CCF0, 0x1D7CE, 0x1D7D8, 0x1D7E2, 0x1D7EC, 0x1D7F6,
  0x1E140, 0x1E2F0, 0x1E4F0, 0x1E5F1, 0x1E950, 0x1FBF0,
];

// The emailed code as ASCII digits: every Unicode decimal digit (Arabic-Indic,
// Devanagari, fullwidth and so on) becomes 0-9 and everything else (spaces,
// dashes, letters) is dropped.
export const normalizeVerificationCode = (value: string): string => {
  let digits = '';
  for (const char of value || '') {
    const codePoint = char.codePointAt(0) as number;
    for (const zero of DIGIT_ZEROS) {
      if (codePoint >= zero && codePoint < zero + 10) {
        digits += String(codePoint - zero);
        break;
      }
    }
  }
  return digits;
};

// SHARE TEXT
// Links starting with http are shared as "<message> <link>" (default message
// "Try {companyName}:"). Short Code Only companies have no link, so the code
// itself is shared. An app message may use {link} and {code} placeholders.
export const buildReferralShareText = (
  affiliate: ReferrerAffiliate,
  companyName: string,
  message?: string
): string => {
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

// LOGGING
// An error's message and code only, never the error itself: an axios error
// carries the request headers (the token) and body (email, emailed code, Play
// purchase token), which would reach an app's custom logger.
export const describeError = (error: unknown): string => {
  const e = error && typeof error === 'object' ? (error as { message?: unknown; code?: unknown }) : null;
  const message = e && typeof e.message === 'string' && e.message ? e.message : 'Unknown error';
  const code = e && (typeof e.code === 'string' || typeof e.code === 'number') ? ` (${e.code})` : '';
  return `${message}${code}`;
};

// TOKEN STORAGE
const tokenKey = (companyId: string) => `${TOKEN_KEY_PREFIX}${companyId}`;

const readToken = async (companyId: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(tokenKey(companyId));
  } catch {
    return null;
  }
};

const saveToken = async (companyId: string, token: string) => {
  await AsyncStorage.setItem(tokenKey(companyId), token);
};

const clearToken = async (companyId: string) => {
  await AsyncStorage.removeItem(tokenKey(companyId));
};

// True only when the server says the token itself is no longer valid. Any
// other 401 or 404 (a proxy, a route that is not live yet) keeps the token.
export const isTokenRejected = (httpStatus: number, data: any): boolean => {
  const code = asString(data && data.code);
  return (httpStatus === 401 && code === 'INVALID_TOKEN') || (httpStatus === 404 && code === 'AFFILIATE_NOT_FOUND');
};

// Clears the rejected token, unless an enrol or verify saved a newer one while
// the request was in flight.
const clearRejectedToken = async (companyId: string, rejectedToken: string) => {
  if ((await readToken(companyId)) === rejectedToken) {
    await clearToken(companyId);
  }
};

// Accept every status so error bodies ({ error, code }) can be read.
const requestOptions = (headers: Record<string, string> = {}) => ({
  headers: { 'Content-Type': 'application/json', ...headers },
  validateStatus: () => true,
});

// The active company ID, or null when there is none or it could not be read
// (storage errors are logged, never thrown).
const readCompanyId = async (deps: ReferralDeps, action: string): Promise<string | null> => {
  try {
    const companyId = await deps.getCompanyId();
    if (!companyId) deps.verboseLog(`Cannot ${action}: no company code available`);
    return companyId || null;
  } catch (error) {
    deps.errorLog(`Cannot ${action}: could not read the company code: ${describeError(error)}`);
    return null;
  }
};

const notInitialized = (): ReferralEnrolResult => ({
  status: 'error',
  errorCode: 'NOT_INITIALIZED',
  errorMessage: 'Call initialize with your company code first.',
});

const networkError = (): ReferralEnrolResult => ({
  status: 'error',
  errorCode: 'NETWORK_ERROR',
  errorMessage: 'Could not reach Insert Affiliate.',
});

// The device id, the phone's OS (so the server can pick the referrer's reward
// store) and any app-supplied accounts, with empty values left out.
const identityBody = async (
  deps: ReferralDeps,
  options?: ReferrerAccountOptions
): Promise<Record<string, string>> => {
  const body: Record<string, string> = {};
  let deviceId: string | null = null;
  try {
    deviceId = await deps.getDeviceId();
  } catch (error) {
    deps.errorLog(`Error reading device id for referrer: ${describeError(error)}`);
  }
  if (deviceId) body.deviceId = deviceId;
  const appUserId = ((options && options.appUserId) || '').trim();
  const playPurchaseToken = ((options && options.playPurchaseToken) || '').trim();
  if (appUserId) body.appUserId = appUserId;
  if (playPurchaseToken) body.playPurchaseToken = playPurchaseToken;
  if (Platform.OS === 'ios' || Platform.OS === 'android') body.os = Platform.OS;
  return body;
};

const postEnrolment = async (
  deps: ReferralDeps,
  path: 'enrol' | 'verify',
  body: Record<string, string>,
  options?: ReferrerAccountOptions
): Promise<ReferralEnrolResult> => {
  const companyId = await readCompanyId(deps, `${path} referrer`);
  if (!companyId) return notInitialized();
  try {
    const response = await axios.post(
      `${API_BASE}/${path}`,
      { ...body, ...(await identityBody(deps, options)), companyId, platform: PLATFORM },
      requestOptions()
    );
    const { result, token } = parseEnrolResponse(response.status, response.data);
    if (token) {
      await saveToken(companyId, token);
    }
    deps.verboseLog(`Referrer ${path} result: ${result.status}${result.errorCode ? ` (${result.errorCode})` : ''}`);
    return result;
  } catch (error) {
    deps.errorLog(`Referrer ${path} failed: ${describeError(error)}`);
    return networkError();
  }
};

// PUBLIC METHODS (wrapped by the provider)
export const createAffiliateForUser = (
  deps: ReferralDeps,
  email: string,
  name: string,
  options?: ReferrerAccountOptions
) => postEnrolment(deps, 'enrol', { email: (email || '').trim(), name: name || '' }, options);

export const verifyAffiliateCode = (
  deps: ReferralDeps,
  email: string,
  code: string,
  name?: string,
  options?: ReferrerAccountOptions
) =>
  postEnrolment(
    deps,
    'verify',
    {
      email: (email || '').trim(),
      code: normalizeVerificationCode(code),
      name: name || '',
    },
    options
  );

export const getMyAffiliateDetails = async (deps: ReferralDeps): Promise<MyAffiliateDetails | null> => {
  const companyId = await readCompanyId(deps, 'get referrer details');
  if (!companyId) return null;
  const token = await readToken(companyId);
  if (!token) {
    deps.verboseLog('No referrer token stored; user is not an affiliate on this device');
    return null;
  }
  try {
    const response = await axios.get(`${API_BASE}/me`, requestOptions({ [TOKEN_HEADER]: token }));
    if (isTokenRejected(response.status, response.data)) {
      deps.verboseLog(`Referrer token rejected (${response.status}); clearing it`);
      await clearRejectedToken(companyId, token);
      return null;
    }
    if (response.status !== 200 || !response.data) {
      deps.verboseLog(`Referrer details request failed with status ${response.status}`);
      return null;
    }
    return parseMyAffiliateDetails(response.data);
  } catch (error) {
    deps.errorLog(`Error getting referrer details: ${describeError(error)}`);
    return null;
  }
};

// Saves the referrer's app accounts after they joined (for users who subscribe
// or log in later). The server then grants any rewards that were waiting.
export const setReferrerAccount = async (
  deps: ReferralDeps,
  options: ReferrerAccountOptions
): Promise<boolean> => {
  const companyId = await readCompanyId(deps, 'set referrer account');
  if (!companyId) return false;
  const token = await readToken(companyId);
  if (!token) {
    deps.verboseLog('No referrer token stored; user is not an affiliate on this device');
    return false;
  }
  try {
    const response = await axios.post(
      `${API_BASE}/me/identity`,
      await identityBody(deps, options),
      requestOptions({ [TOKEN_HEADER]: token })
    );
    if (isTokenRejected(response.status, response.data)) {
      deps.verboseLog(`Referrer token rejected (${response.status}); clearing it`);
      await clearRejectedToken(companyId, token);
      return false;
    }
    const saved = response.status === 200 && !!response.data && response.data.saved === true;
    deps.verboseLog(saved ? 'Referrer account saved' : `Referrer account request failed with status ${response.status}`);
    return saved;
  } catch (error) {
    deps.errorLog(`Error setting referrer account: ${describeError(error)}`);
    return false;
  }
};

export const isUserAnAffiliate = async (deps: ReferralDeps): Promise<boolean> => {
  const companyId = await readCompanyId(deps, 'check referrer');
  if (!companyId) return false;
  return !!(await readToken(companyId));
};

// Never rejects; a storage error is logged and the token may remain.
export const signOutAffiliate = async (deps: ReferralDeps): Promise<void> => {
  const companyId = await readCompanyId(deps, 'sign out referrer');
  if (!companyId) return;
  try {
    await clearToken(companyId);
    deps.verboseLog('Referrer signed out on this device');
  } catch (error) {
    deps.errorLog(`Error signing out referrer: ${describeError(error)}`);
  }
};

export const getReferralProgramConfig = async (deps: ReferralDeps): Promise<ReferralProgramConfig | null> => {
  const companyId = await readCompanyId(deps, 'get referral program config');
  if (!companyId) return null;
  try {
    const response = await axios.get(`${API_BASE}/config/${encodeURIComponent(companyId)}`, requestOptions());
    if (response.status !== 200 || !response.data) {
      deps.verboseLog(`Referral program config request failed with status ${response.status}`);
      return null;
    }
    return parseReferralProgramConfig(response.data);
  } catch (error) {
    deps.errorLog(`Error getting referral program config: ${describeError(error)}`);
    return null;
  }
};

// Opens the system share sheet. Returns false when the user is not an
// affiliate on this device or the details could not be loaded.
export const shareReferralLink = async (deps: ReferralDeps, message?: string): Promise<boolean> => {
  const [details, config] = await Promise.all([getMyAffiliateDetails(deps), getReferralProgramConfig(deps)]);
  if (!details) {
    deps.verboseLog('Cannot share referral link: no referrer details');
    return false;
  }
  return openShareSheet(buildReferralShareText(details, config ? config.companyName : '', message), deps);
};

export const openShareSheet = async (text: string, deps?: Pick<ReferralDeps, 'errorLog'>): Promise<boolean> => {
  try {
    await Share.share({ message: text });
    return true;
  } catch (error) {
    if (deps) deps.errorLog(`Error opening share sheet: ${describeError(error)}`);
    return false;
  }
};
