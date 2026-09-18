// In-app referrals: turn the app's own user into an affiliate, read their
// referral stats and share their link. Backend: /V1/sdk/affiliate.
//
// The company ID is public (it ships in every app binary), so reading the
// user's own stats needs the device token issued on enrol/verify. The token is
// stored per company ID in AsyncStorage and is never logged.
import { Share } from 'react-native';
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

// What the provider hands in: the active company ID and its loggers.
export type ReferralDeps = {
  getCompanyId: () => Promise<string | null>;
  verboseLog: (message: string) => void;
  errorLog: (message: string, error?: unknown) => void;
};

// PARSING
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

const asNumber = (value: unknown): number => {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
};

const asTrigger = (value: unknown): ReferralTrigger =>
  value === 'install' || value === 'event' ? value : 'purchase';

export const parseReferrerAffiliate = (data: any): ReferrerAffiliate => ({
  affiliateName: asString(data && data.affiliateName),
  affiliateShortCode: asString(data && data.affiliateShortCode),
  deeplinkurl: asString(data && data.deeplinkurl),
});

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

// Accept every status so error bodies ({ error, code }) can be read.
const requestOptions = (headers: Record<string, string> = {}) => ({
  headers: { 'Content-Type': 'application/json', ...headers },
  validateStatus: () => true,
});

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

const postEnrolment = async (
  deps: ReferralDeps,
  path: 'enrol' | 'verify',
  body: Record<string, string>
): Promise<ReferralEnrolResult> => {
  const companyId = await deps.getCompanyId();
  if (!companyId) {
    deps.verboseLog(`Cannot ${path} referrer: no company code available`);
    return notInitialized();
  }
  try {
    const response = await axios.post(
      `${API_BASE}/${path}`,
      { ...body, companyId, platform: PLATFORM },
      requestOptions()
    );
    const { result, token } = parseEnrolResponse(response.status, response.data);
    if (token) {
      await saveToken(companyId, token);
    }
    deps.verboseLog(`Referrer ${path} result: ${result.status}${result.errorCode ? ` (${result.errorCode})` : ''}`);
    return result;
  } catch (error) {
    deps.errorLog(`Referrer ${path} failed:`, error);
    return networkError();
  }
};

// PUBLIC METHODS (wrapped by the provider)
export const createAffiliateForUser = (deps: ReferralDeps, email: string, name: string) =>
  postEnrolment(deps, 'enrol', { email: (email || '').trim(), name: name || '' });

export const verifyAffiliateCode = (deps: ReferralDeps, email: string, code: string, name?: string) =>
  postEnrolment(deps, 'verify', {
    email: (email || '').trim(),
    code: (code || '').replace(/\s/g, ''),
    name: name || '',
  });

export const getMyAffiliateDetails = async (deps: ReferralDeps): Promise<MyAffiliateDetails | null> => {
  const companyId = await deps.getCompanyId();
  if (!companyId) {
    deps.verboseLog('Cannot get referrer details: no company code available');
    return null;
  }
  const token = await readToken(companyId);
  if (!token) {
    deps.verboseLog('No referrer token stored; user is not an affiliate on this device');
    return null;
  }
  try {
    const response = await axios.get(`${API_BASE}/me`, requestOptions({ [TOKEN_HEADER]: token }));
    if (response.status === 401 || response.status === 404) {
      deps.verboseLog(`Referrer token rejected (${response.status}); clearing it`);
      await clearToken(companyId);
      return null;
    }
    if (response.status !== 200 || !response.data) {
      deps.verboseLog(`Referrer details request failed with status ${response.status}`);
      return null;
    }
    return parseMyAffiliateDetails(response.data);
  } catch (error) {
    deps.errorLog('Error getting referrer details:', error);
    return null;
  }
};

export const isUserAnAffiliate = async (deps: ReferralDeps): Promise<boolean> => {
  const companyId = await deps.getCompanyId();
  if (!companyId) return false;
  return !!(await readToken(companyId));
};

export const signOutAffiliate = async (deps: ReferralDeps): Promise<void> => {
  const companyId = await deps.getCompanyId();
  if (!companyId) return;
  await clearToken(companyId);
  deps.verboseLog('Referrer signed out on this device');
};

export const getReferralProgramConfig = async (deps: ReferralDeps): Promise<ReferralProgramConfig | null> => {
  const companyId = await deps.getCompanyId();
  if (!companyId) {
    deps.verboseLog('Cannot get referral program config: no company code available');
    return null;
  }
  try {
    const response = await axios.get(`${API_BASE}/config/${encodeURIComponent(companyId)}`, requestOptions());
    if (response.status !== 200 || !response.data) {
      deps.verboseLog(`Referral program config request failed with status ${response.status}`);
      return null;
    }
    return parseReferralProgramConfig(response.data);
  } catch (error) {
    deps.errorLog('Error getting referral program config:', error);
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
    if (deps) deps.errorLog('Error opening share sheet:', error);
    return false;
  }
};
