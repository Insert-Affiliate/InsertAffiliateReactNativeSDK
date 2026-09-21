"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatReferralString = exports.referralString = exports.REFERRAL_ERROR_STRING_KEYS = exports.DEFAULT_REFERRAL_STRINGS = void 0;
exports.DEFAULT_REFERRAL_STRINGS = {
    emailLabel: 'Email',
    emailPlaceholder: 'you@example.com',
    nameLabel: 'Name',
    namePlaceholder: 'Your name',
    joinButton: 'Get my link',
    codeLabel: 'Enter the 6-digit code',
    codePlaceholder: '123456',
    codeSentNotice: 'We sent a 6-digit code to {email}.',
    verifyButton: 'Verify',
    resendButton: 'Send a new code',
    codeResentNotice: 'We sent a 6-digit code to {email}.',
    differentEmailButton: 'Use a different email',
    codeLabelTitle: 'Your code',
    linkLabelTitle: 'Your link',
    copyButton: 'Copy',
    copiedNotice: 'Copied',
    shareButton: 'Share',
    referralsLabel: 'Referrals',
    earnedLabel: 'Earned',
    premiumUntil: 'Free premium until {date}',
    rewardsHeading: 'Your rewards',
    redeemButton: 'Redeem',
    dashboardLink: 'Open my dashboard',
    closeButton: 'Close',
    tryAgainButton: 'Try again',
    loadFailed: 'Could not load your referral details. Check your connection and try again.',
    errorProgramDisabled: 'Referrals are not available in this app right now.',
    errorAffiliateLimitReached: 'The referral program is full right now. Please try again later.',
    errorInvalidCode: 'That code is wrong or has expired.',
    errorTooManyCodes: 'Too many codes requested. Please wait a while and try again.',
    errorRateLimited: 'Too many attempts. Please try again later.',
    errorInvalidEmail: 'Please enter a valid email address.',
    errorNetwork: 'Could not connect. Check your connection and try again.',
    errorServer: 'Something went wrong. Please try again.',
};
// Which string an error code shows. Codes that are not listed (including
// NOT_INITIALIZED and HTTP_<status>) show errorServer.
exports.REFERRAL_ERROR_STRING_KEYS = {
    PROGRAM_DISABLED: 'errorProgramDisabled',
    AFFILIATE_LIMIT_REACHED: 'errorAffiliateLimitReached',
    INVALID_CODE: 'errorInvalidCode',
    TOO_MANY_CODES: 'errorTooManyCodes',
    RATE_LIMITED: 'errorRateLimited',
    INVALID_EMAIL: 'errorInvalidEmail',
    NETWORK_ERROR: 'errorNetwork',
};
// The app's text for a key, or the English default when the app left it out or
// passed a blank string. Keys the type does not list are ignored.
const referralString = (strings, key) => {
    const value = strings ? strings[key] : undefined;
    return typeof value === 'string' && value.trim() ? value : exports.DEFAULT_REFERRAL_STRINGS[key];
};
exports.referralString = referralString;
// Fills the {name} placeholders a string uses. Placeholders it does not use are
// left alone, so a translation can drop or reorder them.
const formatReferralString = (text, values) => Object.keys(values).reduce((out, key) => out.split(`{${key}}`).join(values[key]), text);
exports.formatReferralString = formatReferralString;
