# InsertAffiliateReactNative SDK

![Version](https://img.shields.io/badge/version-1.0.0-brightgreen) ![React Native](https://img.shields.io/badge/React%20Native-0.60%2B-blue) ![Platform](https://img.shields.io/badge/platform-iOS%20%7C%20Android-lightgrey)

The official React Native SDK for [Insert Affiliate](https://insertaffiliate.com) - track affiliate-driven in-app purchases and reward your partners automatically.

**What does this SDK do?** It connects your React Native app to Insert Affiliate's platform, enabling you to track which affiliates drive subscriptions and automatically pay them commissions when users make in-app purchases.

## Table of Contents

- [Quick Start (5 Minutes)](#-quick-start-5-minutes)
- [Essential Setup](#%EF%B8%8F-essential-setup)
  - [1. Initialize the SDK](#1-initialize-the-sdk)
  - [2. Configure In-App Purchase Verification](#2-configure-in-app-purchase-verification)
  - [3. Set Up Deep Linking](#3-set-up-deep-linking)
- [Verify Your Integration](#-verify-your-integration)
- [Advanced Features](#-advanced-features)
- [Troubleshooting](#-troubleshooting)
- [Support](#-support)

---

## 🚀 Quick Start (5 Minutes)

Get up and running with minimal code to validate the SDK works before tackling IAP and deep linking setup.

### Prerequisites

- **React Native 0.60+**
- **iOS 13.0+** / **Android API 21+**
- **Company Code** from your [Insert Affiliate dashboard](https://app.insertaffiliate.com/settings)

### Installation

**Step 1:** Install the SDK package

```bash
npm install insert-affiliate-react-native-sdk
```

**Step 2:** Install required peer dependencies

```bash
npm install @react-native-async-storage/async-storage @react-native-clipboard/clipboard @react-native-community/netinfo react-native-device-info axios
```

**Step 3:** Install iOS pods (iOS only)

```bash
cd ios && pod install && cd ..
```

### Your First Integration

**In `index.js`** - Wrap your app with the provider:

```javascript
import React from 'react';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import { DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

const RootComponent = () => {
  return (
    <DeepLinkIapProvider>
      <App />
    </DeepLinkIapProvider>
  );
};

AppRegistry.registerComponent(appName, () => RootComponent);
```

**In `App.tsx`** - Initialize the SDK:

```javascript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

const App = () => {
  const { initialize, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) {
      initialize(
        "YOUR_COMPANY_CODE",  // Get from https://app.insertaffiliate.com/settings
        true                   // Enable verbose logging for setup
      );
    }
  }, [initialize, isInitialized]);

  return (
    <View>
      <Text>My App</Text>
    </View>
  );
};

export default App;
```

**Expected Console Output:**

When the SDK initializes successfully, you'll see:

```
[Insert Affiliate] SDK initialized with company code: YOUR_COMPANY_CODE
[Insert Affiliate] [VERBOSE] SDK marked as initialized
```

**If you see these logs, the SDK is working!** Now proceed to Essential Setup below.

**Important:** Disable verbose logging in production by setting the second parameter to `false`.

---

## ⚙️ Essential Setup

Complete these three required steps to start tracking affiliate-driven purchases.

### 1. Initialize the SDK

You've already done basic initialization above. Here are additional options:

#### Basic Initialization (Recommended for Getting Started)

```javascript
initialize("YOUR_COMPANY_CODE", true);  // verbose logging enabled
```

<details>
<summary><strong>Advanced Initialization Options</strong> (click to expand)</summary>

```javascript
initialize(
  "YOUR_COMPANY_CODE",
  true,    // verboseLogging - Enable for debugging (disable in production)
  true,    // insertLinksEnabled - Enable Insert Links (Insert Affiliate's built-in deep linking)
  true,    // insertLinksClipboardEnabled - Enable clipboard attribution (triggers permission prompt)
  604800   // affiliateAttributionActiveTime - 7 days attribution timeout in seconds
);
```

**Parameters:**
- `verboseLogging`: Shows detailed logs for debugging (disable in production)
- `insertLinksEnabled`: Set to `true` if using Insert Links, `false` if using Branch/AppsFlyer
- `insertLinksClipboardEnabled`: Enables clipboard-based attribution for Insert Links
  - Improves attribution accuracy when deep linking fails
  - iOS will show a permission prompt: "[Your App] would like to paste from [App Name]"
- `affiliateAttributionActiveTime`: How long affiliate attribution lasts in seconds (omit for no timeout)

</details>

---

### 2. Configure In-App Purchase Verification

**Insert Affiliate requires a receipt verification method to validate purchases.** Choose **ONE** of the following:

| Method | Best For | Setup Time | Complexity |
|--------|----------|------------|------------|
| [**RevenueCat**](#option-1-revenuecat-recommended) | Most developers, managed infrastructure | ~10 min | Simple |
| [**Adapty**](#option-2-adapty) | Paywall A/B testing, analytics | ~10 min | Simple |
| [**Iaptic**](#option-3-iaptic) | Custom requirements, direct control | ~15 min | Medium |
| [**App Store Direct**](#option-4-app-store-direct) | No 3rd party fees (iOS) | ~20 min | Medium |
| [**Google Play Direct**](#option-5-google-play-direct) | No 3rd party fees (Android) | ~20 min | Medium |

<details open>
<summary><h4>Option 1: RevenueCat (Recommended)</h4></summary>

**Step 1: Code Setup**

Complete the [RevenueCat SDK installation](https://www.revenuecat.com/docs/getting-started/installation/reactnative) first, then add to your `App.tsx`:

```javascript
import React, { useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

const App = () => {
  const { initialize, isInitialized, setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) {
      initialize("YOUR_COMPANY_CODE");
    }
  }, [initialize, isInitialized]);

  // Set RevenueCat attribute when affiliate identifier changes
  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        await Purchases.setAttributes({ "insert_affiliate": identifier });
        await Purchases.syncAttributesAndOfferingsIfNeeded();
      }
    });

    return () => setInsertAffiliateIdentifierChangeCallback(null);
  }, [setInsertAffiliateIdentifierChangeCallback]);

  return <YourAppContent />;
};
```

**Step 2: Webhook Setup**

1. In RevenueCat, [create a new webhook](https://www.revenuecat.com/docs/integrations/webhooks)
2. Configure webhook settings:
   - **Webhook URL**: `https://api.insertaffiliate.com/v1/api/revenuecat-webhook`
   - **Event Type**: "All events"
3. In your [Insert Affiliate dashboard](https://app.insertaffiliate.com/settings):
   - Set **In-App Purchase Verification** to `RevenueCat`
   - Copy the `RevenueCat Webhook Authentication Header` value
4. Back in RevenueCat webhook config:
   - Paste the authentication header value into the **Authorization header** field

**RevenueCat setup complete!** Now skip to [Step 3: Set Up Deep Linking](#3-set-up-deep-linking)

</details>

<details>
<summary><h4>Option 2: Adapty</h4></summary>

**Step 1: Install Adapty SDK**

```bash
npm install react-native-adapty
cd ios && pod install && cd ..
```

Complete the [Adapty SDK installation](https://adapty.io/docs/sdk-installation-reactnative) for any additional platform-specific setup.

**Step 2: Code Setup**

```javascript
import React, { useEffect, useRef } from 'react';
import { adapty } from 'react-native-adapty';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

const ADAPTY_PUBLIC_SDK_KEY = 'YOUR_ADAPTY_PUBLIC_SDK_KEY'; // From https://app.adapty.io/

const App = () => {
  const { initialize, isInitialized, setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();
  const adaptyActivationPromiseRef = useRef(null);

  // Initialize Adapty SDK
  useEffect(() => {
    const initAdapty = async () => {
      try {
        adaptyActivationPromiseRef.current = adapty.activate(ADAPTY_PUBLIC_SDK_KEY, {
          __ignoreActivationOnFastRefresh: __DEV__,
        });
        await adaptyActivationPromiseRef.current;
      } catch (error) {
        console.error('Failed to activate Adapty SDK:', error);
      }
    };

    if (!adaptyActivationPromiseRef.current) {
      initAdapty();
    }
  }, []);

  // Initialize Insert Affiliate SDK
  useEffect(() => {
    if (!isInitialized) {
      initialize("YOUR_COMPANY_CODE");
    }
  }, [initialize, isInitialized]);

  // Set Adapty attribute when affiliate identifier changes
  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        if (adaptyActivationPromiseRef.current) {
          try {
            // Wait for Adapty activation before updating profile
            await adaptyActivationPromiseRef.current;

            await adapty.updateProfile({
              codableCustomAttributes: {
                insert_affiliate: identifier,
              },
            });
          } catch (error) {
            console.error('Failed to update Adapty profile with affiliate identifier:', error);
          }
        } else {
          console.error('Adapty SDK is not initialized');
        }
      }
    });

    return () => setInsertAffiliateIdentifierChangeCallback(null);
  }, [setInsertAffiliateIdentifierChangeCallback]);

  return <YourAppContent />;
};
```

**Step 3: Webhook Setup**

1. In your [Insert Affiliate dashboard](https://app.insertaffiliate.com/settings):
   - Set **In-App Purchase Verification** to `Adapty`
   - Copy the **Adapty Webhook URL**
   - Copy the **Adapty Webhook Authorization Header** value

2. In the [Adapty Dashboard](https://app.adapty.io/integrations):
   - Navigate to **Integrations** → **Webhooks**
   - Set **Production URL** to the webhook URL from Insert Affiliate
   - Set **Sandbox URL** to the same webhook URL
   - Paste the authorization header value into **Authorization header value**
   - Enable these options:
     - **Exclude historical events**
     - **Send attribution**
     - **Send trial price**
     - **Send user attributes**
   - Save the configuration

**Step 4: Verify Integration**

To confirm the affiliate identifier is set correctly:
1. Go to [app.adapty.io/profiles/users](https://app.adapty.io/profiles/users)
2. Find the test user who made a purchase
3. Look for `insert_affiliate` in **Custom attributes** with format: `{SHORT_CODE}-{UUID}`

**Adapty setup complete!** Now skip to [Step 3: Set Up Deep Linking](#3-set-up-deep-linking)

</details>

<details>
<summary><h4>Option 3: Iaptic</h4></summary>

**Step 1: Code Setup**

Complete the [Iaptic account setup](https://www.iaptic.com/signup) first, then add to your component:

```javascript
import React, { useEffect, useState } from 'react';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import { useIAP } from 'react-native-iap';

const App = () => {
  const { initialize, isInitialized, validatePurchaseWithIapticAPI } = useDeepLinkIapProvider();
  const { currentPurchase } = useIAP();

  useEffect(() => {
    if (!isInitialized) {
      initialize("YOUR_COMPANY_CODE");
    }
  }, [initialize, isInitialized]);

  // Validate purchases with Iaptic
  useEffect(() => {
    if (currentPurchase) {
      validatePurchaseWithIapticAPI(
        currentPurchase,
        'YOUR_IAPTIC_APP_ID',
        'YOUR_IAPTIC_APP_NAME',
        'YOUR_IAPTIC_PUBLIC_KEY'
      ).then((isValid) => {
        console.log(isValid ? "Purchase validated" : "Validation failed");
      });
    }
  }, [currentPurchase]);

  return <YourAppContent />;
};
```

Replace:
- `YOUR_IAPTIC_APP_ID` with your [Iaptic App ID](https://www.iaptic.com/account)
- `YOUR_IAPTIC_APP_NAME` with your [Iaptic App Name](https://www.iaptic.com/account)
- `YOUR_IAPTIC_PUBLIC_KEY` with your [Iaptic Public Key](https://www.iaptic.com/settings)

**Step 2: Webhook Setup**

1. Open [Insert Affiliate settings](https://app.insertaffiliate.com/settings):
   - Set the In-App Purchase Verification method to `Iaptic`
   - Copy the `Iaptic Webhook URL` and `Iaptic Webhook Sandbox URL`
2. Go to [Iaptic Settings](https://www.iaptic.com/settings):
   - Paste the Webhook URLs into the corresponding fields
   - Click **Save Settings**
3. Complete the [Iaptic App Store Server Notifications setup](https://www.iaptic.com/documentation/setup/ios-subscription-status-url)
4. Complete the [Iaptic Google Play Notifications setup](https://www.iaptic.com/documentation/setup/connect-with-google-publisher-api)

**Iaptic setup complete!** Now proceed to [Step 3: Set Up Deep Linking](#3-set-up-deep-linking)

</details>

<details>
<summary><h4>Option 4: App Store Direct</h4></summary>

**Step 1: Apple App Store Notification Setup**

Visit [our docs](https://docs.insertaffiliate.com/direct-store-purchase-integration#1-apple-app-store-server-notifications) and complete the required App Store Server to Server Notifications setup.

**Step 2: Implementing Purchases**

```javascript
import { Platform } from 'react-native';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import { requestSubscription } from 'react-native-iap';

const { returnUserAccountTokenAndStoreExpectedTransaction } = useDeepLinkIapProvider();

const handleBuySubscription = async (product) => {
  try {
    let appAccountToken = null;

    if (Platform.OS === 'ios') {
      appAccountToken = await returnUserAccountTokenAndStoreExpectedTransaction();
    }

    await requestSubscription({
      sku: product.productId,
      ...(appAccountToken ? { applicationUsername: appAccountToken } : {}),
    });
  } catch (error) {
    console.error("Error processing subscription:", error);
  }
};
```

**App Store Direct setup complete!** Now proceed to [Step 3: Set Up Deep Linking](#3-set-up-deep-linking)

</details>

<details>
<summary><h4>Option 5: Google Play Direct</h4></summary>

**Step 1: RTDN Setup**

Visit [our docs](https://docs.insertaffiliate.com/direct-google-play-store-purchase-integration) and complete the required Real Time Developer Notifications setup.

**Step 2: Implementing Purchases**

```javascript
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import { useIAP } from 'react-native-iap';

const App = () => {
  const { storeExpectedStoreTransaction } = useDeepLinkIapProvider();
  const { currentPurchase } = useIAP();

  useEffect(() => {
    if (currentPurchase && Platform.OS === 'android' && currentPurchase.purchaseToken) {
      storeExpectedStoreTransaction(currentPurchase.purchaseToken);
    }
  }, [currentPurchase, storeExpectedStoreTransaction]);

  return <YourAppContent />;
};
```

**Google Play Direct setup complete!** Now proceed to [Step 3: Set Up Deep Linking](#3-set-up-deep-linking)

</details>

---

### 3. Set Up Deep Linking

**Deep linking lets affiliates share unique links that track users to your app.** Choose **ONE** deep linking provider:

| Provider | Best For | Complexity | Setup Guide |
|----------|----------|------------|-------------|
| [**Insert Links**](#option-1-insert-links-simplest) | Simple setup, no 3rd party | Simple | [View](#option-1-insert-links-simplest) |
| [**Branch.io**](#option-2-branchio) | Robust attribution, deferred deep linking | Medium | [View](#option-2-branchio) |
| [**AppsFlyer**](#option-3-appsflyer) | Enterprise analytics, comprehensive attribution | Medium | [View](#option-3-appsflyer) |

<details open>
<summary><h4>Option 1: Insert Links (Simplest)</h4></summary>

Insert Links is Insert Affiliate's built-in deep linking solution - no third-party SDK required.

**Prerequisites:**
- Complete the [Insert Links setup](https://docs.insertaffiliate.com/insert-links) in the Insert Affiliate dashboard

**Step 1: Initialize with Insert Links enabled**

```javascript
useEffect(() => {
  if (!isInitialized) {
    initialize(
      "YOUR_COMPANY_CODE",
      true,   // verboseLogging
      true,   // insertLinksEnabled
      false   // insertLinksClipboardEnabled (set true for better attribution, triggers permission)
    );
  }
}, [initialize, isInitialized]);
```

**Step 2: Set up the identifier change callback**

Choose the example that matches your IAP verification platform:

**With RevenueCat:**

```javascript
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import Purchases from 'react-native-purchases';

const App = () => {
  const { setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();

  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        await Purchases.setAttributes({ "insert_affiliate": identifier });
        await Purchases.syncAttributesAndOfferingsIfNeeded();
      }
    });

    return () => setInsertAffiliateIdentifierChangeCallback(null);
  }, []);

  return <YourAppContent />;
};
```

**With Adapty:**

```javascript
import React, { useEffect, useRef } from 'react';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import { adapty } from 'react-native-adapty';

const App = () => {
  const { setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();
  const adaptyActivationPromiseRef = useRef(null);

  // Initialize Adapty SDK (see Option 2: Adapty for full setup)
  useEffect(() => {
    const initAdapty = async () => {
      try {
        adaptyActivationPromiseRef.current = adapty.activate('YOUR_ADAPTY_PUBLIC_SDK_KEY', {
          __ignoreActivationOnFastRefresh: __DEV__,
        });
        await adaptyActivationPromiseRef.current;
      } catch (error) {
        console.error('Failed to activate Adapty SDK:', error);
      }
    };

    if (!adaptyActivationPromiseRef.current) {
      initAdapty();
    }
  }, []);

  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier && adaptyActivationPromiseRef.current) {
        try {
          await adaptyActivationPromiseRef.current;
          await adapty.updateProfile({
            codableCustomAttributes: {
              insert_affiliate: identifier,
            },
          });
        } catch (error) {
          console.error('Failed to update Adapty profile:', error);
        }
      }
    });

    return () => setInsertAffiliateIdentifierChangeCallback(null);
  }, [setInsertAffiliateIdentifierChangeCallback]);

  return <YourAppContent />;
};
```

**With Apphud:**

```javascript
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import Apphud from 'react-native-apphud';

const App = () => {
  const { setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();

  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        await Apphud.setUserProperty("insert_affiliate", identifier, false);
      }
    });

    return () => setInsertAffiliateIdentifierChangeCallback(null);
  }, []);

  return <YourAppContent />;
};
```

**With Iaptic:**

```javascript
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import InAppPurchase from 'react-native-iaptic';

const App = () => {
  const { setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();

  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        InAppPurchase.stop();
        InAppPurchase.initialize({
          iapProducts: iapProductsArray,
          validatorUrlString: "https://validator.iaptic.com/v3/validate?appName=YOUR_APP_NAME&apiKey=YOUR_API_KEY",
          applicationUsername: identifier
        });
      }
    });

    return () => setInsertAffiliateIdentifierChangeCallback(null);
  }, []);

  return <YourAppContent />;
};
```

**With App Store / Google Play Direct:**

```javascript
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

const App = () => {
  const { setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();

  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        console.log('Affiliate identifier stored:', identifier);
        // Identifier is stored automatically for direct store integration
      }
    });

    return () => setInsertAffiliateIdentifierChangeCallback(null);
  }, []);

  return <YourAppContent />;
};
```

**Step 3: iOS Native Setup (Required)**

Update your `ios/YourApp/AppDelegate.mm`:

```objc
#import <React/RCTLinkingManager.h>

- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void(^)(NSArray * __nullable restorableObjects))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}
```

**Step 4: Expo Router Setup (If Using Expo Router)**

If you're using Expo Router, deep links will cause a "This screen does not exist" error because both the Insert Affiliate SDK and Expo Router try to handle the incoming URL. The SDK correctly processes the affiliate attribution, but Expo Router simultaneously attempts to navigate to the URL path (e.g., `/insert-affiliate`), which doesn't exist as a route.

To fix this, create `app/+native-intent.tsx` to intercept Insert Affiliate URLs before Expo Router processes them:

```tsx
// app/+native-intent.tsx
// Tell Expo Router to skip navigation for Insert Affiliate URLs
// The SDK handles these via native Linking - we just prevent router errors

export function redirectSystemPath({ path }: { path: string }): string | null {
  // Skip navigation for Insert Affiliate deep links
  if (path.includes('insert-affiliate') || path.includes('insertAffiliate')) {
    return null; // SDK handles it via Linking API
  }
  return path; // Let Expo Router handle all other URLs normally
}
```

This ensures:
- The Insert Affiliate SDK still receives and processes the URL via the native Linking API
- Expo Router ignores the URL and doesn't attempt navigation
- No "screen not found" errors

See the [Expo Router +native-intent docs](https://docs.expo.dev/router/reference/native-intent/) for more details.

**Testing Deep Links:**

```bash
# iOS Simulator
xcrun simctl openurl booted "YOUR_IOS_URL_SCHEME://TEST_SHORT_CODE"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "YOUR_ANDROID_URL_SCHEME://TEST_SHORT_CODE"
```

**Insert Links setup complete!** Skip to [Verify Your Integration](#-verify-your-integration)

</details>

<details>
<summary><h4>Option 2: Branch.io</h4></summary>

Branch.io provides robust attribution and deferred deep linking capabilities.

**Key Integration Steps:**
1. Install and configure [Branch SDK for React Native](https://help.branch.io/developers-hub/docs/react-native)
2. Subscribe to Branch deep link events
3. Extract `~referring_link` from Branch callback
4. Pass to Insert Affiliate SDK using `setInsertAffiliateIdentifier()`

**[View complete Branch.io integration guide](docs/deep-linking-branch.md)**

Includes full examples for:
- RevenueCat integration
- Adapty integration
- Apphud integration
- Iaptic integration
- App Store / Google Play Direct integration

**After completing Branch setup**, skip to [Verify Your Integration](#-verify-your-integration)

</details>

<details>
<summary><h4>Option 3: AppsFlyer</h4></summary>

AppsFlyer provides enterprise-grade analytics and comprehensive attribution.

**Key Integration Steps:**
1. Install and configure [AppsFlyer SDK for React Native](https://dev.appsflyer.com/hc/docs/react-native-plugin)
2. Create AppsFlyer OneLink in dashboard
3. Listen for `onDeepLink`, `onAppOpenAttribution`, and `onInstallConversionData` callbacks
4. Pass to Insert Affiliate SDK using `setInsertAffiliateIdentifier()`

**[View complete AppsFlyer integration guide](docs/deep-linking-appsflyer.md)**

Includes full examples for:
- RevenueCat integration
- Adapty integration
- Apphud integration
- Iaptic integration
- Store Direct integration
- Deferred deep linking setup

**After completing AppsFlyer setup**, proceed to [Verify Your Integration](#-verify-your-integration)

</details>

---

## ✅ Verify Your Integration

Before going live, verify everything works correctly:

### Integration Checklist

- [ ] **SDK Initializes**: Check console for `SDK initialized with company code` log
- [ ] **Affiliate Identifier Stored**: Click a test affiliate link and verify identifier is stored
- [ ] **Purchase Tracked**: Make a test purchase and verify transaction appears in Insert Affiliate dashboard

### Testing Commands

**Test Deep Link (iOS Simulator):**

```bash
xcrun simctl openurl booted "https://your-deep-link-url/abc123"
```

**Test Deep Link (Android Emulator):**

```bash
adb shell am start -W -a android.intent.action.VIEW -d "https://your-deep-link-url/abc123"
```

**Check Stored Affiliate Identifier:**

```javascript
const affiliateId = await returnInsertAffiliateIdentifier();
console.log('Current affiliate ID:', affiliateId);
```

### Common Setup Issues

| Issue | Solution |
|-------|----------|
| "Company code is not set" | Ensure `initialize()` is called before any other SDK methods |
| "No affiliate identifier found" | User must click an affiliate link before making a purchase |
| Deep link opens browser instead of app | Verify URL schemes in Info.plist (iOS) and AndroidManifest.xml (Android) |
| Purchase not tracked | Check webhook configuration in IAP verification platform |

---

## 🔧 Advanced Features

<details>
<summary><h3>Event Tracking (Beta)</h3></summary>

Track custom events beyond purchases (e.g., signups, referrals) to incentivize affiliates for specific actions.

```javascript
const { trackEvent } = useDeepLinkIapProvider();

// Track custom event (affiliate identifier must be set first)
await trackEvent('user_signup');
```

**Use Cases:**
- Pay affiliates for signups instead of purchases
- Track trial starts, content unlocks, or other conversions

</details>

<details>
<summary><h3>Short Codes</h3></summary>

Short codes are unique, 3-25 character alphanumeric identifiers that affiliates can share (e.g., "SAVE20" in a TikTok video description).

**Validate and Store Short Code:**

```javascript
const { setShortCode } = useDeepLinkIapProvider();

const handleApplyCode = async (code) => {
  const isValid = await setShortCode(code);
  if (isValid) {
    Alert.alert('Success', 'Affiliate code applied!');
  } else {
    Alert.alert('Error', 'Invalid affiliate code');
  }
};
```

**Get Affiliate Details Without Setting:**

```javascript
const { getAffiliateDetails } = useDeepLinkIapProvider();

const details = await getAffiliateDetails('SAVE20');
if (details) {
  console.log('Affiliate Name:', details.affiliateName);
  console.log('Short Code:', details.affiliateShortCode);
  console.log('Deep Link:', details.deeplinkurl);
}
```

Learn more: [Short Codes Documentation](https://docs.insertaffiliate.com/short-codes)

</details>

<details>
<summary><h3>Dynamic Offer Codes / Discounts</h3></summary>

Automatically apply discounts or trials when users come from specific affiliates.

**How It Works:**
1. Configure an offer code modifier in your [Insert Affiliate dashboard](https://app.insertaffiliate.com/affiliates) (e.g., `_oneWeekFree`)
2. SDK automatically fetches and stores the modifier when affiliate identifier is set
3. Use the modifier to construct dynamic product IDs

**Quick Example:**

```javascript
const { OfferCode } = useDeepLinkIapProvider();

const baseProductId = "oneMonthSubscription";
const dynamicProductId = OfferCode
  ? `${baseProductId}${OfferCode}`  // e.g., "oneMonthSubscription_oneWeekFree"
  : baseProductId;

// Use dynamicProductId when fetching/purchasing products
```

**[View complete Dynamic Offer Codes guide](docs/dynamic-offer-codes.md)**

Includes full examples for:
- App Store Connect and Google Play Console setup
- RevenueCat integration with dynamic product selection
- Native react-native-iap integration
- Testing and troubleshooting

</details>

<details>
<summary><h3>Attribution Timeout Control</h3></summary>

Control how long affiliate attribution remains active after a user clicks a link.

**Set Timeout During Initialization:**

```javascript
// 7-day attribution window (604800 seconds)
initialize(
  "YOUR_COMPANY_CODE",
  false,  // verboseLogging
  false,  // insertLinksEnabled
  false,  // insertLinksClipboardEnabled
  604800  // affiliateAttributionActiveTime
);
```

**Check Attribution Validity:**

```javascript
const { isAffiliateAttributionValid, getAffiliateStoredDate } = useDeepLinkIapProvider();

const isValid = await isAffiliateAttributionValid();
const storedDate = await getAffiliateStoredDate();
```

**Common Timeout Values:**
- 1 day: `86400`
- 7 days: `604800` (recommended)
- 30 days: `2592000`
- No timeout: omit parameter (default)

**Bypass Timeout Check:**

```javascript
// Get identifier even if attribution has expired
const rawIdentifier = await returnInsertAffiliateIdentifier(true);
```

</details>

---

## 🔍 Troubleshooting

### Initialization Issues

**Error:** "Company code is not set"
- **Cause:** SDK not initialized or `initialize()` called after other SDK methods
- **Solution:** Call `initialize()` in your main App component's `useEffect` before any other SDK methods

### Deep Linking Issues

**Problem:** Deep link opens browser instead of app
- **Cause:** Missing or incorrect URL scheme configuration
- **Solution:**
  - iOS: Add URL scheme to Info.plist and configure associated domains
  - Android: Add intent filters to AndroidManifest.xml

**Problem:** "This screen does not exist" error with Expo Router
- **Cause:** Both Insert Affiliate SDK and Expo Router are trying to handle the same URL
- **Solution:** Create `app/+native-intent.tsx` to intercept Insert Affiliate URLs before Expo Router processes them. See [Expo Router Setup](#option-1-insert-links-simplest) in the Insert Links section.

**Problem:** "No affiliate identifier found"
- **Cause:** User hasn't clicked an affiliate link yet
- **Solution:** Test with simulator/emulator:
  ```bash
  # iOS
  xcrun simctl openurl booted "YOUR_DEEP_LINK_URL"
  # Android
  adb shell am start -W -a android.intent.action.VIEW -d "YOUR_DEEP_LINK_URL"
  ```

### Purchase Tracking Issues

**Problem:** Purchases not appearing in Insert Affiliate dashboard
- **Cause:** Webhook not configured or affiliate identifier not passed to IAP platform
- **Solution:**
  - Verify webhook URL and authorization headers are correct
  - For RevenueCat: Confirm `insert_affiliate` attribute is set before purchase
  - Enable verbose logging and check console for errors

### Verbose Logging

Enable detailed logs during development to diagnose issues:

```javascript
initialize("YOUR_COMPANY_CODE", true);  // second parameter enables verbose logging
```

**Important:** Disable verbose logging in production builds.

### Getting Help

- [Documentation](https://docs.insertaffiliate.com)
- [Dashboard Support](https://app.insertaffiliate.com/help)
- [Report Issues](https://github.com/Insert-Affiliate/InsertAffiliateReactNativeSDK/issues)

---

## 📚 Support

- **Documentation**: [docs.insertaffiliate.com](https://docs.insertaffiliate.com)
- **Dashboard Support**: [app.insertaffiliate.com/help](https://app.insertaffiliate.com/help)
- **Issues**: [GitHub Issues](https://github.com/Insert-Affiliate/InsertAffiliateReactNativeSDK/issues)
- **Company Code**: [Get yours from Settings](https://app.insertaffiliate.com/settings)

---

**Need help getting started?** Check out our [quickstart guide](https://docs.insertaffiliate.com) or [contact support](https://app.insertaffiliate.com/help).
