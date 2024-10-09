# InsertAffiliateReactNative SDK

## Overview

The InsertAffiliateReactNative SDK is designed for React Native applications, providing seamless integration with the Insert Affiliate platform. This SDK enables functionalities such as managing affiliate links, handling in-app purchases (IAP), and utilizing deep links.

## Features

- **Unique Device Identification**: Generates and stores a short unique device ID to identify users effectively.
- **Affiliate Identifier Management**: Set and retrieve the affiliate identifier based on user-specific links.
- **In-App Purchase (IAP) Initialization**: Easily reinitialize in-app purchases with validation options using the affiliate identifier.
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

## Wrapping Your Application
### Wrap your application with the provider, passing the required context properties:

```javascript
<DeepLinkIapProvider
  iapSkus={IAP_SKUS}
  iapticAppId="IAPTIC_APPLICATION_IDENTIFIER"
  iapticAppName="IAPTIC_APP_NAME"
  iapticAppSecret="IAPTIC_SECRET_KEY">
  <Child />
</DeepLinkIapProvider>
```

## Example Implementation
Here’s a complete example of how to use the SDK:


```javascript
import React from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { IAP_SKUS } from './app/config/constants';
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

  return (
    <View style={styles.mainContainer}>
      {referrerLink ? (
        <>
          <Text style={styles.msg}>{`Referrer Link:\n${referrerLink}`}</Text>
          <Text style={styles.msg}>{`User ID:\n${userId}`}</Text>
        </>
      ) : (
        <Text>{`Please open the app using a branch link`}</Text>
      )}
      {referrerLink && subscriptions.length ? (
        <Button
          disabled={iapLoading}
          title={
            userPurchase
              ? `Successfully Purchased`
              : `Click to Buy (${subscriptions[0].localizedPrice} / ${subscriptions[0].subscriptionPeriodUnitIOS})`
          }
          onPress={() => {
            if (iapLoading) return;
            if (!userPurchase) handleBuySubscription(subscriptions[0].productId);
          }}
        />
      ) : null}
      {isIapticValidated && (
        <Text style={styles.msg}>{`You are IAPTIC Validated`}</Text>
      )}
      {iapLoading && <ActivityIndicator size={'small'} color={'black'} />}
    </View>
  );
};

const App = () => {
  return (
    <DeepLinkIapProvider
      iapSkus={IN_APP_PURCHASES_IDS}
      iapticAppId="IAPTIC_APP_BUNDLE_IDENTIFIER"
      iapticAppName="IAPTIC_APP_NAME"
      iapticAppSecret="IAPTIC_APP_SECRET_KEY">
      <Child />
    </DeepLinkIapProvider>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    rowGap: 12,
  },
  msg: {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: 'black',
    textAlign: 'center',
  },
});

export default App;
```

