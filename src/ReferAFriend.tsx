// Drop-in "Refer a friend" screen. Must be rendered inside DeepLinkIapProvider.
//
// States: loading -> not enrolled (email + name, "Get my link") -> code step
// when the email already belongs to an affiliate -> enrolled (code, link,
// Copy, Share, stats, free premium date, reward codes, "Open my dashboard").
// A connected device whose details cannot be loaded (offline, server error)
// shows "Try again" instead of the sign-up form.
// Store rules: share sheet only, no Contacts access, nothing gated behind sharing.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import useDeepLinkIapProvider from './useDeepLinkIapProvider';
import {
  formatReferralString,
  referralString,
  ReferralStrings,
  REFERRAL_ERROR_STRING_KEYS,
} from './referralStrings';
import {
  buildReferralShareText,
  isPremiumActive,
  normalizeVerificationCode,
  openShareSheet,
  MyAffiliateDetails,
  ReferralEnrolResult,
  ReferralProgramConfig,
  ReferrerAffiliate,
  rewardCodesForPlatform,
} from './referrals';

const DEFAULT_PRIMARY_COLOR = '#6A0DAD';
const DEFAULT_HEADLINE = 'Refer a friend';

export type ReferAFriendProps = {
  visible: boolean;
  onClose: () => void;
  // Prefill, usually the app's logged-in user
  email?: string;
  name?: string;
  // The user's RevenueCat app user id / Adapty customer user id and their own
  // Google Play subscription purchase token, so automatic rewards reach them
  appUserId?: string;
  playPurchaseToken?: string;
  // Share message; may use {link} and {code} placeholders
  shareMessage?: string;
  // Override the portal settings
  primaryColor?: string;
  headline?: string;
  rewardText?: string;
  // Every label on the screen. Keys left out keep the English default.
  strings?: Partial<ReferralStrings>;
};

type Step = 'loading' | 'enrol' | 'code' | 'enrolled' | 'failed';

const errorStringKey = (result: ReferralEnrolResult): keyof ReferralStrings =>
  (result.errorCode && REFERRAL_ERROR_STRING_KEYS[result.errorCode]) || 'errorServer';

const formatMoney = (amount: number, currency: string) => {
  try {
    return amount.toLocaleString(undefined, { style: 'currency', currency });
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  try {
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  } catch {
    return date.toDateString();
  }
};

const ReferAFriend: React.FC<ReferAFriendProps> = ({
  visible,
  onClose,
  email: emailProp,
  name: nameProp,
  appUserId,
  playPurchaseToken,
  shareMessage,
  primaryColor: primaryColorProp,
  headline: headlineProp,
  rewardText: rewardTextProp,
  strings,
}) => {
  const {
    createAffiliateForUser,
    verifyAffiliateCode,
    setReferrerAccount,
    getMyAffiliateDetails,
    isUserAnAffiliate,
    getReferralProgramConfig,
  } = useDeepLinkIapProvider();

  const [step, setStep] = useState<Step>('loading');
  const [config, setConfig] = useState<ReferralProgramConfig | null>(null);
  const [affiliate, setAffiliate] = useState<ReferrerAffiliate | null>(null);
  const [details, setDetails] = useState<MyAffiliateDetails | null>(null);
  const [email, setEmail] = useState(emailProp || '');
  const [name, setName] = useState(nameProp || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const primaryColor = primaryColorProp || (config && config.primaryColor) || DEFAULT_PRIMARY_COLOR;
  const headline = headlineProp || (config && config.headline) || DEFAULT_HEADLINE;
  const accountOptions = appUserId || playPurchaseToken ? { appUserId, playPurchaseToken } : undefined;
  const rewardText = rewardTextProp || (config && config.rewardText) || '';
  // The app's label for a key, or the English default.
  const t = (key: keyof ReferralStrings) => referralString(strings, key);
  const errorText = (result: ReferralEnrolResult) => t(errorStringKey(result));

  const showEnrolled = useCallback(async (fallback?: ReferrerAffiliate) => {
    const loaded = await getMyAffiliateDetails();
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
  }, [getMyAffiliateDetails]);

  // Each load gets an id; a load that is no longer the latest (the screen was
  // closed or reopened, or "Try again" was pressed) stops without updating.
  const loadIdRef = useRef(0);

  // Never rejects: an unexpected error shows the "Try again" step.
  const load = async () => {
    const loadId = ++loadIdRef.current;
    const isCurrent = () => loadIdRef.current === loadId;
    setStep('loading');
    setError('');
    try {
      await loadSteps(isCurrent);
    } catch {
      if (isCurrent()) setStep('failed');
    }
  };

  const loadSteps = async (isCurrent: () => boolean) => {
    const showEnrol = () => {
      setDetails(null);
      setAffiliate(null);
      setStep('enrol');
    };

    const [loadedConfig, enrolled] = await Promise.all([getReferralProgramConfig(), isUserAnAffiliate()]);
    if (!isCurrent()) return;
    setConfig(loadedConfig);
    if (!enrolled) {
      showEnrol();
      return;
    }
    // Already enrolled: save the accounts first so waiting rewards show below
    if (accountOptions) {
      await setReferrerAccount(accountOptions);
      if (!isCurrent()) return;
    }
    const loaded = await getMyAffiliateDetails();
    if (!isCurrent()) return;
    if (loaded) {
      setDetails(loaded);
      setAffiliate(loaded);
      setStep('enrolled');
      return;
    }
    // Only a device whose token is gone (signed out, or rejected by the
    // server) goes back to the sign-up form.
    const stillEnrolled = await isUserAnAffiliate();
    if (!isCurrent()) return;
    if (stillEnrolled) {
      setStep('failed');
    } else {
      showEnrol();
    }
  };

  useEffect(() => {
    if (!visible) return;
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
  const handleResult = async (result: ReferralEnrolResult, noticeKey: keyof ReferralStrings = 'codeSentNotice') => {
    if (result.status === 'verificationRequired') {
      setCode('');
      setNotice(formatReferralString(t(noticeKey), { email: email.trim() }));
      setStep('code');
      return;
    }
    if (result.status === 'created' || result.status === 'connected') {
      await showEnrolled(result.affiliate);
      return;
    }
    setError(errorText(result));
  };

  // A ref, not the busy state, guards submits: two taps in the same frame both
  // see the same busy value, but the ref changes at once.
  const submittingRef = useRef(false);

  const run = async (action: () => Promise<void>) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch {
      setError(errorText({ status: 'error' }));
    } finally {
      submittingRef.current = false;
      setBusy(false);
    }
  };

  const onRetry = () => {
    setNotice('');
    load();
  };

  const onGetLink = () => run(async () => {
    setNotice('');
    await handleResult(await createAffiliateForUser(email.trim(), name.trim(), accountOptions));
  });

  const onVerify = () => run(async () => {
    await handleResult(await verifyAffiliateCode(email.trim(), code, name.trim(), accountOptions));
  });

  const onResend = () => run(async () => {
    await handleResult(await createAffiliateForUser(email.trim(), name.trim(), accountOptions), 'codeResentNotice');
  });

  const shareText = affiliate ? buildReferralShareText(affiliate, config ? config.companyName : '', shareMessage) : '';
  const hasLink = !!affiliate && /^http/i.test(affiliate.deeplinkurl);

  const onCopy = () => {
    if (!affiliate) return;
    Clipboard.setString(hasLink ? affiliate.deeplinkurl : affiliate.affiliateShortCode);
    setNotice(t('copiedNotice'));
  };

  const onShare = () => {
    if (shareText) openShareSheet(shareText);
  };

  const onRedeem = (redeemUrl: string) => {
    if (redeemUrl) {
      Linking.openURL(redeemUrl).catch(() => {});
    }
  };

  // Only codes this phone's store can redeem (App Store on iOS, Google Play on Android).
  const rewardCodes = details ? rewardCodesForPlatform(details.rewardCodes, Platform.OS) : [];

  const onOpenDashboard = () => {
    if (details && details.dashboardUrl) {
      Linking.openURL(details.dashboardUrl).catch(() => {});
    }
  };

  const primaryButton = (label: string, onPress: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: primaryColor, opacity: disabled || busy ? 0.5 : pressed ? 0.8 : 1 },
      ]}
    >
      {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>{label}</Text>}
    </Pressable>
  );

  const linkButton = (label: string, onPress: () => void) => (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={busy} style={styles.linkButton}>
      <Text style={[styles.linkText, { color: primaryColor }]}>{label}</Text>
    </Pressable>
  );

  const renderBody = () => {
    if (step === 'loading') {
      return <ActivityIndicator style={styles.loading} color={primaryColor} />;
    }

    if (step === 'failed') {
      return (
        <View>
          <Text style={styles.rewardText}>{t('loadFailed')}</Text>
          {primaryButton(t('tryAgainButton'), onRetry)}
        </View>
      );
    }

    if (step === 'enrol') {
      if (config && !config.enabled) {
        return <Text style={styles.rewardText}>{t('errorProgramDisabled')}</Text>;
      }
      return (
        <View>
          <Text style={styles.label}>{t('emailLabel')}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={t('emailPlaceholder')}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Text style={styles.label}>{t('nameLabel')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('namePlaceholder')}
            textContentType="name"
          />
          {primaryButton(t('joinButton'), onGetLink, !email.trim())}
        </View>
      );
    }

    if (step === 'code') {
      return (
        <View>
          <Text style={styles.label}>{t('codeLabel')}</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(value) => setCode(normalizeVerificationCode(value).slice(0, 6))}
            placeholder={t('codePlaceholder')}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
          />
          {primaryButton(t('verifyButton'), onVerify, code.length !== 6)}
          {linkButton(t('resendButton'), onResend)}
          {linkButton(t('differentEmailButton'), () => { setError(''); setNotice(''); setStep('enrol'); })}
        </View>
      );
    }

    if (!affiliate) return null;
    return (
      <View>
        <Text style={styles.label}>{t('codeLabelTitle')}</Text>
        <Text style={styles.code} selectable>{affiliate.affiliateShortCode}</Text>
        {hasLink ? (
          <>
            <Text style={styles.label}>{t('linkLabelTitle')}</Text>
            <Text style={styles.link} selectable numberOfLines={2}>{affiliate.deeplinkurl}</Text>
          </>
        ) : null}
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            onPress={onCopy}
            style={({ pressed }) => [styles.button, styles.rowButton, styles.rowButtonSpacer, styles.outlineButton, { borderColor: primaryColor, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: primaryColor }]}>{t('copyButton')}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onShare}
            style={({ pressed }) => [styles.button, styles.rowButton, { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.buttonText}>{t('shareButton')}</Text>
          </Pressable>
        </View>
        {details ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{details.referralCount}</Text>
                <Text style={styles.statLabel}>{t('referralsLabel')}</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatMoney(details.totalEarned, details.currency)}</Text>
                <Text style={styles.statLabel}>{t('earnedLabel')}</Text>
              </View>
            </View>
            {details.premiumUntil && isPremiumActive(details.premiumUntil) ? (
              <Text style={styles.premium}>
                {formatReferralString(t('premiumUntil'), { date: formatDate(details.premiumUntil) })}
              </Text>
            ) : null}
            {rewardCodes.length > 0 ? (
              <View style={styles.rewards}>
                <Text style={styles.rewardsTitle}>{t('rewardsHeading')}</Text>
                {rewardCodes.map((reward) => (
                  <View key={reward.code} style={styles.rewardRow}>
                    <Text style={styles.rewardCode} selectable>{reward.code}</Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => onRedeem(reward.redeemUrl)}
                      disabled={!reward.redeemUrl}
                      style={({ pressed }) => [styles.redeemButton, { backgroundColor: primaryColor, opacity: !reward.redeemUrl ? 0.5 : pressed ? 0.8 : 1 }]}
                    >
                      <Text style={styles.redeemText}>{t('redeemButton')}</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            {details.dashboardUrl ? linkButton(t('dashboardLink'), onOpenDashboard) : null}
          </>
        ) : null}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.headline}>{headline}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={t('closeButton')} onPress={onClose} hitSlop={12}>
                <Text style={styles.close}>✕</Text>
              </Pressable>
            </View>
            {rewardText ? <Text style={styles.rewardText}>{rewardText}</Text> : null}
            {notice ? <Text style={styles.notice}>{notice}</Text> : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {renderBody()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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

export default ReferAFriend;
