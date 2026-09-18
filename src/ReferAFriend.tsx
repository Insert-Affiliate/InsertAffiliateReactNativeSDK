// Drop-in "Refer a friend" screen. Must be rendered inside DeepLinkIapProvider.
//
// States: loading -> not enrolled (email + name, "Get my link") -> code step
// when the email already belongs to an affiliate -> enrolled (code, link,
// Copy, Share, stats, "Open my dashboard").
// Store rules: share sheet only, no Contacts access, nothing gated behind sharing.
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
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
  buildReferralShareText,
  openShareSheet,
  MyAffiliateDetails,
  ReferralEnrolResult,
  ReferralProgramConfig,
  ReferrerAffiliate,
} from './referrals';

const DEFAULT_PRIMARY_COLOR = '#6A0DAD';
const DEFAULT_HEADLINE = 'Refer a friend';

export type ReferAFriendProps = {
  visible: boolean;
  onClose: () => void;
  // Prefill, usually the app's logged-in user
  email?: string;
  name?: string;
  // Share message; may use {link} and {code} placeholders
  shareMessage?: string;
  // Override the portal settings
  primaryColor?: string;
  headline?: string;
  rewardText?: string;
};

type Step = 'loading' | 'enrol' | 'code' | 'enrolled';

const ERROR_MESSAGES: Record<string, string> = {
  PROGRAM_DISABLED: 'Referrals are not available in this app right now.',
  AFFILIATE_LIMIT_REACHED: 'The referral program is full right now. Please try again later.',
  INVALID_CODE: 'That code is wrong or has expired.',
  TOO_MANY_CODES: 'Too many codes requested. Please wait a while and try again.',
  RATE_LIMITED: 'Too many attempts. Please try again later.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  NETWORK_ERROR: 'Could not connect. Check your connection and try again.',
};

const errorText = (result: ReferralEnrolResult) =>
  (result.errorCode && ERROR_MESSAGES[result.errorCode]) || 'Something went wrong. Please try again.';

const formatMoney = (amount: number, currency: string) => {
  try {
    return amount.toLocaleString(undefined, { style: 'currency', currency });
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
};

const ReferAFriend: React.FC<ReferAFriendProps> = ({
  visible,
  onClose,
  email: emailProp,
  name: nameProp,
  shareMessage,
  primaryColor: primaryColorProp,
  headline: headlineProp,
  rewardText: rewardTextProp,
}) => {
  const {
    createAffiliateForUser,
    verifyAffiliateCode,
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
  const rewardText = rewardTextProp || (config && config.rewardText) || '';

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

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    setStep('loading');
    setError('');
    setNotice('');
    setCode('');
    setEmail(emailProp || '');
    setName(nameProp || '');

    (async () => {
      const [loadedConfig, enrolled] = await Promise.all([getReferralProgramConfig(), isUserAnAffiliate()]);
      if (cancelled) return;
      setConfig(loadedConfig);
      const shown = enrolled ? await showEnrolled() : false;
      if (cancelled) return;
      if (!shown) {
        setDetails(null);
        setAffiliate(null);
        setStep('enrol');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const handleResult = async (result: ReferralEnrolResult) => {
    if (result.status === 'verificationRequired') {
      setCode('');
      setNotice(`We sent a 6-digit code to ${email.trim()}.`);
      setStep('code');
      return;
    }
    if (result.status === 'created' || result.status === 'connected') {
      await showEnrolled(result.affiliate);
      return;
    }
    setError(errorText(result));
  };

  const run = async (action: () => Promise<void>) => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await action();
    } finally {
      setBusy(false);
    }
  };

  const onGetLink = () => run(async () => {
    setNotice('');
    await handleResult(await createAffiliateForUser(email.trim(), name.trim()));
  });

  const onVerify = () => run(async () => {
    await handleResult(await verifyAffiliateCode(email.trim(), code, name.trim()));
  });

  const onResend = () => run(async () => {
    await handleResult(await createAffiliateForUser(email.trim(), name.trim()));
  });

  const shareText = affiliate ? buildReferralShareText(affiliate, config ? config.companyName : '', shareMessage) : '';
  const hasLink = !!affiliate && /^http/i.test(affiliate.deeplinkurl);

  const onCopy = () => {
    if (!affiliate) return;
    Clipboard.setString(hasLink ? affiliate.deeplinkurl : affiliate.affiliateShortCode);
    setNotice('Copied');
  };

  const onShare = () => {
    if (shareText) openShareSheet(shareText);
  };

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

    if (step === 'enrol') {
      if (config && !config.enabled) {
        return <Text style={styles.rewardText}>{ERROR_MESSAGES.PROGRAM_DISABLED}</Text>;
      }
      return (
        <View>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            textContentType="name"
          />
          {primaryButton('Get my link', onGetLink, !email.trim())}
        </View>
      );
    }

    if (step === 'code') {
      return (
        <View>
          <Text style={styles.label}>Enter the 6-digit code</Text>
          <TextInput
            style={[styles.input, styles.codeInput]}
            value={code}
            onChangeText={(value) => setCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="123456"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            maxLength={6}
          />
          {primaryButton('Verify', onVerify, code.length !== 6)}
          {linkButton('Send a new code', onResend)}
          {linkButton('Use a different email', () => { setError(''); setNotice(''); setStep('enrol'); })}
        </View>
      );
    }

    if (!affiliate) return null;
    return (
      <View>
        <Text style={styles.label}>Your code</Text>
        <Text style={styles.code} selectable>{affiliate.affiliateShortCode}</Text>
        {hasLink ? (
          <>
            <Text style={styles.label}>Your link</Text>
            <Text style={styles.link} selectable numberOfLines={2}>{affiliate.deeplinkurl}</Text>
          </>
        ) : null}
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            onPress={onCopy}
            style={({ pressed }) => [styles.button, styles.rowButton, styles.rowButtonSpacer, styles.outlineButton, { borderColor: primaryColor, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={[styles.buttonText, { color: primaryColor }]}>Copy</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onShare}
            style={({ pressed }) => [styles.button, styles.rowButton, { backgroundColor: primaryColor, opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.buttonText}>Share</Text>
          </Pressable>
        </View>
        {details ? (
          <>
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{details.referralCount}</Text>
                <Text style={styles.statLabel}>Referrals</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{formatMoney(details.totalEarned, details.currency)}</Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
            </View>
            {details.dashboardUrl ? linkButton('Open my dashboard', onOpenDashboard) : null}
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
              <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={12}>
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
});

export default ReferAFriend;
