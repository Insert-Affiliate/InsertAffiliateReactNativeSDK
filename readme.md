# InsertAffiliateReactNative SDK

## Overview

The **InsertAffiliateReactNative SDK** is designed for React Native applications, providing seamless integration with the [Insert Affiliate platform](https://insertaffiliate.com). This SDK enables functionalities such as managing affiliate links, handling in-app purchases (IAP), and utilising deep links. For more details and to access the Insert Affiliate dashboard, visit [app.insertaffiliate.com](https://app.insertaffiliate.com).

## Features

- **Unique Device Identification**: Generates and stores a short unique device ID to identify users effectively.
- **Affiliate Identifier Management**: Set and retrieve the affiliate identifier based on user-specific links.
- **In-App Purchase (IAP) Initialisation**: Easily reinitialise in-app purchases with validation options using the affiliate identifier.
- **Offer Code Handling**: Fetch offer codes from the Insert Affiliate API and open redeem URLs directly in the App Store.

## Peer Dependencies

Before using this package, ensure you have the following dependencies installed:

- [react-native-iap](https://www.npmjs.com/package/react-native-iap)
- [react-native-branch](https://www.npmjs.com/package/react-native-branch)
- [axios](https://www.npmjs.com/package/axios)

## Installation

To integrate the InsertAffiliateReactNative SDK into your project, run:

```bash
npm install insert-affiliate-react-native-sdk
```

## Usage
### Importing the SDK
Import the provider from the package:


```javascript
import { DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
```

## 1. Integrating the Provider in Your Application (`App.tsx`)
### Step 1: Wrap Your Application with the Iaptic Provider and Pass Context Properties

- Replace `{{ your_iaptic_app_id }}` with your **Iaptic App ID**. You can find this [here](https://www.iaptic.com/account).
- Replace `{{ your_iaptic_app_name }}` with your **Iaptic App Name**. You can find this [here](https://www.iaptic.com/account).
- Replace `{{ your_iaptic_public_key }}` with your **Iaptic Public Key**. You can find this [here](https://www.iaptic.com/settings).

Here's the code with placeholders for you to swap out:

```javascript
const App = () => {
  return (
    <DeepLinkIapProvider
      iapSkus={IAP_SKUS}
      iapticAppId="{{ your_iaptic_app_id }}"
      iapticAppName="{{ your_iaptic_app_name }}"
      iapticAppPublicKey="{{ your_iaptic_public_key }}">
      <Child />
    </DeepLinkIapProvider>
  );
};
```

## 2. When the User Makes a Purchase, Call Our SDK's "handleBuySubscription"
Here’s a complete example of how to use the SDK:

In the code below, please remember to update your IAP_SKUS with the comma separated list of your in app purchase SKU's.

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
            if (!userPurchase) handleBuySubscription(subscriptions[0].productId); //
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
      iapticAppId="IAPTIC_APP_BUNDLE_IDENTIFIER"
      iapticAppName="IAPTIC_APP_NAME"
      iapticAppPublicKey="IAPTIC_APP_SECRET_KEY">
      <Child />
    </DeepLinkIapProvider>
  );
};

export default App;
```

