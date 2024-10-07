# Introdcution

A library that will provide a React Context provider through which you can wrap your whole application and can use the implementation of in app purchases and branch links.

# Peer Dependencies

These are the dependencies you need to install before using this package:

<ul>
<li><a href="https://www.npmjs.com/package/react-native-iap">react-native-iap</a></li>
<li><a href="https://www.npmjs.com/package/react-native-branch">react-native-branch</a></li>
<li><a href="https://www.npmjs.com/package/axios">axios</a></li>
</ul>

# How to use

You have to do the following steps to use this package:

<ol>
<li>install the package <code>npm install react-native-branch-iaptic</code></li>
<li>Import context from react-native-branch--iaptic <code>import {
  BranchIapProvider,
} from 'react-native-branch-iaptic';</code></li>
<li>Now wrap your applcation with above context like</li>

```
    <BranchIapProvider
      iapSkus={IAP_SKUS}
      iapticAppId="IAPTIC_APPLICATION_IDENTIFIER"
      iapticAppName="IAPTIC_APP_NAME"
      iapticAppSecret="IAPTIC_SECRET_KEY">
      <Child />
    </BranchIapProvider>    
```
<li>If you check above you, need to pass context properties as shown above</li>

<li>For your reference, here is the complete example of its usgae</li>

```
import React from 'react';
import {ActivityIndicator, Button, StyleSheet, Text, View} from 'react-native';
import {IAP_SKUS} from './app/config/constants';
import {
  BranchIapProvider,
  useBranchIapProvider,
} from 'react-native-branch-iaptic';

const Child = () => {
  const {
    referrerLink,
    subscriptions,
    iapLoading,
    handleBuySubscription,
    userId,
    userPurchase,
    isIapticValidated,
  } = useBranchIapProvider();
  return (
    <View style={styles.mainContainer}>
      {referrerLink ? (
        <>
          <Text style={styles.msg}>{`Referrer Link:\n${referrerLink}`}</Text>
          <Text style={styles.msg}>{`User ID:\n${userId}`}</Text>
        </>
      ) : (
        <Text>{`Please open app using branch link`}</Text>
      )}
      {referrerLink && subscriptions.length ? (
        <Button
          disabled={iapLoading}
          title={
            userPurchase
              ? `Successfully Purchased`
              : // @ts-ignore
                `Click to Buy (${subscriptions[0].localizedPrice} / ${subscriptions[0].subscriptionPeriodUnitIOS})`
          }
          onPress={() => {
            if (iapLoading) return;
            else if (userPurchase) {
            } else handleBuySubscription(subscriptions[0].productId);
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
    <BranchIapProvider
      iapSkus={IN_APP_PURCHASES_IDS}
      iapticAppId="IAPTIC_APP_BUNDLE_IDENTIFIER"
      iapticAppName="IAPTIC_APP_NAME"
      iapticAppSecret="IAPTIC_APP_SECRET_KEY">
      <Child />
    </BranchIapProvider>
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

</ol>
