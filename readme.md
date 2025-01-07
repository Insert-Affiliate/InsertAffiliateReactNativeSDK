# InsertAffiliateReactNative SDK

## Overview

The **InsertAffiliateReactNative SDK** is designed for React Native applications, providing seamless integration with the [Insert Affiliate platform](https://insertaffiliate.com). The InsertAffiliateReactNative SDK simplifies affiliate marketing for iOS apps with in-app-purchases, allowing developers to create a seamless user experience for affiliate tracking and monetisation.

### Features

- **Unique Device ID**: Creates a unique ID to anonymously associate purchases with users for tracking purposes.
- **Affiliate Identifier Management**: Set and retrieve the affiliate identifier based on user-specific links.
- **In-App Purchase (IAP) Initialisation**: Easily reinitialise in-app purchases with the option to validate using an affiliate identifier.

## Peer Dependencies

Before using this package, ensure you have the following dependencies installed:

- [react-native-iap](https://www.npmjs.com/package/react-native-iap)
- [axios](https://www.npmjs.com/package/axios)

## Getting Started

To get started with the InsertAffiliateReactNative SDK:

1. [Install the React Native Package](#installation)
2. [Initialise the SDK in App.tsx](#basic-usage)
3. [Set up in-app purchases (Required)](#in-app-purchase-setup-required)
4. [Set up deep linking (Required)](#deep-link-setup-required)

## Installation

To integrate the InsertAffiliateReactNative SDK into your app:

1. Install the NPM package.
```bash
npm install insert-affiliate-react-native-sdk
```

## Basic Usage

### Initialisation in `App.tsx`

First, wrap your with our provider and call the `initialise` method early in your app's lifecycle

- Replace `{{ your_iaptic_app_id }}` with your **Iaptic App ID**. You can find this [here](https://www.iaptic.com/account).
- Replace `{{ your_iaptic_app_name }}` with your **Iaptic App Name**. You can find this [here](https://www.iaptic.com/account).
- Replace `{{ your_iaptic_public_key }}` with your **Iaptic Public Key**. You can find this [here](https://www.iaptic.com/settings).
- Replace `{{ your_company_code }}` with the unique company code associated with your Insert Affiliate account. You can find this code in your dashboard under [Settings](http://app.insertaffiliate.com/settings).

Here's the code with placeholders for you to swap out:

```javascript
const Child = () => {
  const {
    referrerLink,
    subscriptions,
    iapLoading,
    handleBuySubscription,
    userId,
    userPurchase,
    isIapticValidated,
    trackEvent,
    initialize,
  } = useDeepLinkIapProvider();

  useEffect(() => {
    initialize("{{ your-company-code }}");
  }, [initialize]);
  
  // ...
  
}

const App = () => {
  return (
    <DeepLinkIapProvider
      iapSkus={IAP_SKUS}
      iapticAppId="{{ your_iaptic_app_id }}"
      iapticAppName="{{ your_iaptic_app_name }}"
      iapticPublicKey="{{ your_iaptic_public_key }}">
      <Child />
    </DeepLinkIapProvider>
  );
};
```

## In-App Purchase Setup [Required]
Insert Affiliate requires a Receipt Verification platform to validate in-app purchases. You must choose **one** of our supported partners:
- [RevenueCat](https://www.revenuecat.com/)
- [Iaptic](https://www.iaptic.com/account)

### Option 1: RevenueCat Integration
<!--#### 1. Code Setup-->
<!--First, complete the [RevenueCat SDK installation](https://www.revenuecat.com/docs/getting-started/installation/ios). Then modify your `AppDelegate.swift`:-->
   
COMING SOON...

### Option 2: Iaptic Integration
First, complete the [Iaptic account setup](https://www.iaptic.com/signup).

Then, when the User Makes a Purchase, call `handleBuySubscription`


```javascript
import React from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { DeepLinkIapProvider, useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

const Child = () => {
  const {
    referrerLink,
    subscriptions,
    iapLoading,
    handleBuySubscription,
    userId,
    userPurchase,
    isIapticValidated,
  } = useDeepLinkIapProvider();

  export const IAP_SKUS = Platform.select({
    android: [''], // Here, put a comma separated list of the In App Purchase SKU's
    ios: [''], // Here, put a comma separated list of the In App Purchase SKU's
  }) as string[];


  return (
    <View>
      {subscriptions.length ? (
        <Button
          disabled={iapLoading}
          title={
            userPurchase
              ? `Successfully Purchased`
              : `Click to Buy (${subscriptions[0].localizedPrice} / ${subscriptions[0].subscriptionPeriodUnitIOS})`
          }
          onPress={() => {
            if (iapLoading) return;
             // Calling Insert Affiliate's handleBuySubscription...
            if (!userPurchase) handleBuySubscription(subscriptions[0].productId);
          }}
        />
      ) : null}
      {iapLoading && <ActivityIndicator size={'small'} color={'black'} />}
    </View>
  );
};

const App = () => {
  return (
    // Wrapped application code from the previous step...
    <DeepLinkIapProvider
      iapSkus={IAP_SKUS}
      iapticAppId="your_iaptic_app_id"
      iapticAppName="your_iaptic_app_name"
      iapticPublicKey="your_iaptic_public_key">
      <Child />
    </DeepLinkIapProvider>
  );
};

export default App;
```
- Replace your IAP_SKUS with the comma separated list of your in app purchase SKU's.

## Deep Link Setup [Required]

### Step 1: Add the Deep Linking Platform Dependency

In this example, the deep linking functionality is implemented using [Branch.io](https://dashboard.branch.io/).

Any alternative deep linking platform can be used by passing the referring link to ```InsertAffiliateSwift.setInsertAffiliateIdentifier(referringLink: "{{ link }}")``` as in the below Branch.io example

After setting up your Branch integration, add the following code to your ```index.js```

<!--#### Example with RevenueCat-->
<!--```swift-->
<!--import SwiftUI-->
<!--import BranchSDK-->
<!--import InAppPurchaseLib-->
<!--import InsertAffiliateSwift-->

<!--class AppDelegate: UIResponder, UIApplicationDelegate {-->
<!--  func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil) -> Bool {-->
<!--    Branch.getInstance().initSession(launchOptions: launchOptions) { (params, error) in-->
<!--      if let referringLink = params?["~referring_link"] as? String {-->
<!--        InsertAffiliateSwift.setInsertAffiliateIdentifier(referringLink: referringLink) { result in-->
<!--          guard let shortCode = result else {-->
<!--            return-->
<!--          }-->

<!--          Purchases.shared.logIn(shortCode) { (customerInfo, created, error) in-->
<!--            // customerInfo updated for my_app_user_id. If you are having issues, you can investigate here.-->
<!--          }-->
<!--      }-->
<!--    }-->
<!--    return true-->
<!--  }-->
<!--}-->
<!--```-->

#### Example with Iaptic
```swift
import branch from 'react-native-branch';
import { DeepLinkIapProvider, useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

branch.subscribe(async ({ error, params }) => {
    if (error) {
      console.error('Error from Branch: ' + error);
      return;
    }
 
    if (params['+clicked_branch_link']) {
        if (params["~referring_link"]) {
            setInsertAffiliateIdentifier(params["~referring_link"], (shortLink) => {
                console.log("Insert Affiliate - setInsertAffiliateIdentifier: ", params["~referring_link"], " - Stored shortLink ", shortLink);
            });
        }
    }
});

```

## Additional Features

## 1. Event Tracking (Beta)

The **InsertAffiliateReactNative SDK** now includes a beta feature for event tracking. Use event tracking to log key user actions such as signups, purchases, or referrals. This is useful for:
- Understanding user behaviour.
- Measuring the effectiveness of marketing campaigns.
- Incentivising affiliates for designated actions being taken by the end users, rather than just in app purchases (i.e. pay an affilaite for each signup).

At this stage, we cannot guarantee that this feature is fully resistant to tampering or manipulation.

### Using `trackEvent`

To track an event, use the `trackEvent` function. Make sure to set an affiliate identifier first; otherwise, event tracking won’t work. Here’s an example:

```javascript
const {
  referrerLink,
  subscriptions,
  iapLoading,
  handleBuySubscription,
  userId,
  userPurchase,
  isIapticValidated,
  trackEvent, // Required for trackEvent
} = useDeepLinkIapProvider();

<Button
  title={'track event'}
  onPress={() => {
    trackEvent('event_name')
      .then(() => console.log('Event tracked successfully!'))
  }}
/>
```