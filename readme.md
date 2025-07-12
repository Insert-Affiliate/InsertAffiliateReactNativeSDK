# InsertAffiliateReactNative SDK

## Overview

The **InsertAffiliateReactNative SDK** is designed for React Native applications, providing seamless integration with the [Insert Affiliate platform](https://insertaffiliate.com). The InsertAffiliateReactNative SDK simplifies affiliate marketing for iOS apps with in-app-purchases, allowing developers to create a seamless user experience for affiliate tracking and monetisation.

### Features

- **Unique Device ID**: Creates a unique ID to anonymously associate purchases with users for tracking purposes.
- **Affiliate Identifier Management**: Set and retrieve the affiliate identifier based on user-specific links.
- **In-App Purchase (IAP) Initialisation**: Easily reinitialise in-app purchases with the option to validate using an affiliate identifier.

## Getting Started

To get started with the InsertAffiliateReactNative SDK:

1. [Install the SDK](#installation)
2. [Set up the provider in Index.js and initialize the SDK in App.tsx](#basic-usage)
3. [Set up in-app purchases (Required)](#in-app-purchase-setup-required)
4. [Set up deep linking in Index.js (Required)](#deep-link-setup-required)

## Installation

To integrate the InsertAffiliateReactNative SDK into your app:

1. Install the NPM package.
```bash
npm install insert-affiliate-react-native-sdk
```

## Architecture Overview

The SDK uses a clean, two-file architecture:

- **`index.js`** (Entry Point): Provider wrapper and deep link handling
- **`App.tsx`** (UI Logic): SDK initialization and your app components

This separation ensures clean code organization and proper initialization timing.

## Basic Usage

Follow the steps below to install the SDK.

### Step 1: Entry Point in `Index.js`
```javascript
import React from 'react';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import {DeepLinkIapProvider} from 'insert-affiliate-react-native-sdk';

const RootComponent = () => {
  return (
    <DeepLinkIapProvider>
      <App />
    </DeepLinkIapProvider>
  );
};

AppRegistry.registerComponent(appName, () => RootComponent);
```

#### Step 2: SDK initialization in `App.tsx`

First, wrap your with our provider and call the `initialize` method early in your app's lifecycle:

```javascript
const Child = () => {
  const { initialize, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) {
      initialize("{{ your-company-code }}");
    }
  }, [initialize, isInitialized]);
}

const App = () => {
  return <Child />;
};
```
- Replace `{{ your_company_code }}` with the unique company code associated with your Insert Affiliate account. You can find this code in your dashboard under [Settings](http://app.insertaffiliate.com/settings).


## In-App Purchase Setup [Required]
Insert Affiliate requires a Receipt Verification platform to validate in-app purchases. You must choose **one** of our supported partners:
- [RevenueCat](https://www.revenuecat.com/)
- [Iaptic](https://www.iaptic.com/account)
- [App Store Direct Integration](#app-store-direct-integration)
- [Google Play Store Direct Integration](#google-play-store-direct-integration)

### Option 1: RevenueCat Integration
#### Step 1. Code Setup
First, complete the [RevenueCat SDK installation](https://www.revenuecat.com/docs/getting-started/installation/reactnative). Then modify your `App.tsx`:

```javascript
import React, {useEffect} from 'react'; 
import {AppRegistry} from 'react-native';
import branch from 'react-native-branch';
import App from './App';
import {name as appName} from './app.json';
import {useDeepLinkIapProvider, DeepLinkIapProvider} from 'insert-affiliate-react-native-sdk';

// ... //
const {
    initialize,
    isInitialized,
    returnInsertAffiliateIdentifier
} = useDeepLinkIapProvider();

React.useEffect(() => {
    const handleAffiliateLogin = async () => {
        try {
            if (isInitialized) {
                const affiliateIdentifier = await returnInsertAffiliateIdentifier();
                
                if (affiliateIdentifier) {
                    await Purchases.setAttributes({"insert_affiliate" : affiliateIdentifier});
                }
            }
        } catch (error) {
            console.error('Error during affiliate login flow:', error);
        }
    };

    handleAffiliateLogin();
}, [isInitialized, returnInsertAffiliateIdentifier]);
// ... //
```

#### Step 2. Webhook Setup

1. Go to RevenueCat and [create a new webhook](https://www.revenuecat.com/docs/integrations/webhooks)

2. Configure the webhook with these settings:
   - Webhook URL: `https://api.insertaffiliate.com/v1/api/revenuecat-webhook`
   - Authorization header: Use the value from your Insert Affiliate dashboard (you'll get this in step 4)
   - Set "Event Type" to "All events"

3. In your [Insert Affiliate dashboard settings](https://app.insertaffiliate.com/settings):
   - Navigate to the verification settings
   - Set the in-app purchase verification method to `RevenueCat`

4. Back in your Insert Affiliate dashboard:
   - Locate the `RevenueCat Webhook Authentication Header` value
   - Copy this value
   - Paste it as the Authorization header value in your RevenueCat webhook configuration


### Option 2: Iaptic Integration
#### 1. Code Setup
First, complete the [Iaptic account setup](https://www.iaptic.com/signup) and code integration.

Then after setting up the in app purchase (IAP) with Iaptic, call Insert Affiliate's ```validatePurchaseWithIapticAPI``` on purchase.

```javascript
import React from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { DeepLinkIapProvider, useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import { useIAP, requestSubscription, withIAPContext, getProducts, getSubscriptions, initConnection } from "react-native-iap"; 

const Child = () => {
    const {
        initialize,
        isInitialized,
        validatePurchaseWithIapticAPI,
    } = useDeepLinkIapProvider();

    const [iapLoading, setIapLoading] = useState(false);
    const { currentPurchase, connected } = useIAP();
    
    // ***...***
    // Fetch & Load your subscription/purchases and handling the IAP purchase here as per the Iaptic Documentation...
    // ***...***

    // Initialize the Insert Affiliate SDK at the earliest possible moment
    useEffect(() => {
        if (!isInitialized) {
          initialize("{{ your_company_code }}");
        }
    }, [initialize, isInitialized]);

    // Validate the purchase with Iaptic through Insert Affiliate's SDK for Affiliate Tracking
    useEffect(() => {
        if (currentPurchase) {
            validatePurchaseWithIapticAPI(
                currentPurchase,
                '{{ your_iaptic_app_id }}',
                '{{ your_iaptic_app_name }}',
                '{{ your_iaptic_public_key }}',
              ).then((isValid: boolean) => {
                if (isValid) {
                  console.log("Purchase validated successfully.");
                } else {
                  console.error("Purchase validation failed.");
                }
            });
        }
    }, [currentPurchase, handlePurchaseValidation]);
    
    return (
        <View>
            <Button
                disabled={iapLoading}
                title={`Click to Buy Subscription`}
                onPress={() => handleBuySubscription("oneMonthSubscriptionTwo")}
            />
            {iapLoading && <ActivityIndicator size={"small"} color={"black"} />}
        </View>
    );
};

const App = () => {
  return (
    <Child />
  );
};

export default App;
```
- Replace `{{ your_iaptic_app_id }}` with your **Iaptic App ID**. You can find this [here](https://www.iaptic.com/account).
- Replace `{{ your_iaptic_app_name }}` with your **Iaptic App Name**. You can find this [here](https://www.iaptic.com/account).
- Replace `{{ your_iaptic_public_key }}` with your **Iaptic Public Key**. You can find this [here](https://www.iaptic.com/settings).
- Replace `{{ your_company_code }}` with the unique company code associated with your Insert Affiliate account. You can find this code in your dashboard under [Settings](http://app.insertaffiliate.com/settings).

#### 2. Webhook Setup
1. Open the [Insert Affiliate settings](https://app.insertaffiliate.com/settings):
  - Navigate to the Verification Settings section
  - Set the In-App Purchase Verification method to `Iaptic`
  - Copy the `Iaptic Webhook URL` and the `Iaptic Webhook Sandbox URL`- you'll need it in the next step.
2. Go to the [Iaptic Settings](https://www.iaptic.com/settings)
- Paste the copied `Iaptic Webhook URL` into the `Webhook URL` field
- Paste the copied `Iaptic Webhook Sandbox URL` into the `Sandbox Webhook URL` field
- Click **Save Settings**.
3. Check that you have completed the [Iaptic setup for the App Store Server Notifications](https://www.iaptic.com/documentation/setup/ios-subscription-status-url)
4. Check that you have completed the [Iaptic setup for the Google Play Notifications URL](https://www.iaptic.com/documentation/setup/connect-with-google-publisher-api)

### Option 3: App Store Direct Integration

Our direct App Store integration is currently in beta and currently supports subscriptions only. **Consumables and one-off purchases are not yet supported** due to App Store server-to-server notification limitations.

We plan to release support for consumables and one-off purchases soon. In the meantime, you can use a receipt verification platform from the other integration options.

#### Apple App Store Notification Setup
To proceed, visit [our docs](https://docs.insertaffiliate.com/direct-store-purchase-integration#1-apple-app-store-server-notifications) and complete the required setup steps to set up App Store Server to Server Notifications.

#### Implementing Purchases

##### 1. Import Required Modules  

Ensure you import the necessary dependencies, including `Platform` and `useDeepLinkIapProvider` from the SDK.  

```javascript
import { Platform } from 'react-native';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import { requestSubscription } from 'react-native-iap';

const { returnUserAccountTokenAndStoreExpectedTransaction } = useDeepLinkIapProvider();
```


##### 2. Handle the Purchase
When a user initiates a subscription, retrieve the appAccountToken and pass it to the requestSubscription call:

```javascript
const handleBuySubscription = async (product: SubscriptionAndroid | Subscription) => {
    try {
        let appAccountToken = null;

        // Step 1: Retrieve the appAccountToken for iOS
        if (Platform.OS === 'ios') {
            appAccountToken = await returnUserAccountTokenAndStoreExpectedTransaction();
        }

        // Step 2: Request the subscription and pass the token for tracking
        await requestSubscription({
            sku: product?.productId,
            ...(appAccountToken ? { applicationUsername: appAccountToken } : {}),
        });

    } catch (error) {
        console.error("Error processing subscription:", error);
    }
};

```


### Option 4: Google Play Store Direct Integration
Our direct Google Play Store integration is currently in beta.

#### Real Time Developer Notifications (RTDN) Setup

Visit [our docs](https://docs.insertaffiliate.com/direct-google-play-store-purchase-integration) and complete the required set up steps for Google Play's Real Time Developer Notifications.

#### Implementing Purchases

##### 1. Import Required Modules  

Ensure you import the necessary dependencies, including `Platform` and `useDeepLinkIapProvider` from the SDK.  

```javascript
import React, {useEffect, useState} from 'react';
import { Platform } from 'react-native';
import { DeepLinkIapProvider, useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import { currentPurchase, requestSubscription } from 'react-native-iap';

const { storeExpectedStoreTransaction } = useDeepLinkIapProvider();

useEffect(() => {
    if (currentPurchase) {
        if (Platform.OS === 'android' && currentPurchase.purchaseToken) {
            // Step 1: Store the expected transaction for Google Play purchases
            storeExpectedStoreTransaction(
              currentPurchase.purchaseToken
            );
        }
    }
}, [currentPurchase, storeExpectedStoreTransaction]);
```



## Deep Link Setup [Required]

Insert Affiliate requires a Deep Linking platform to create links for your affiliates. Our platform works with **any** deep linking provider, and you only need to follow these steps:
1. **Create a deep link** in your chosen third-party platform and pass it to our dashboard when an affiliate signs up. 
2. **Handle deep link clicks** in your app by passing the clicked link:
   ```javascript
   await setInsertAffiliateIdentifier(referringLink)
   ```
3. **Integrate with a Receipt Verification platform** by using the result from `setInsertAffiliateIdentifier` to log in or set your application’s username. Examples below include [**Iaptic**](https://github.com/Insert-Affiliate/InsertAffiliateReactNativeSDK?tab=readme-ov-file#example-with-iaptic) and [**RevenueCat**](https://github.com/Insert-Affiliate/InsertAffiliateReactNativeSDK?tab=readme-ov-file#example-with-revenuecat)

### Deep Linking with Branch.io
To set up deep linking with Branch.io, follow these steps:

1. Create a deep link in Branch and pass it to our dashboard when an affiliate signs up.
  - Example: [Create Affiliate](https://docs.insertaffiliate.com/create-affiliate).
2. Modify Your Deep Link Handling in `Index.js`
  - After setting up your Branch integration, add the following code to your app:


#### Example with RevenueCat
```javascript
import {useDeepLinkIapProvider, DeepLinkIapProvider} from 'insert-affiliate-react-native-sdk';

//...
const DeepLinkHandler = () => {
    const {setInsertAffiliateIdentifier} = useDeepLinkIapProvider();
    
    useEffect(() => {
      const branchSubscription = branch.subscribe(async ({error, params}) => {
        if (error) {
          console.error('Error from Branch:', error);
          return;
        }

        if (params['+clicked_branch_link']) {
          const referringLink = params['~referring_link'];
          if (referringLink) {
            try {
              let insertAffiliateIdentifier = await setInsertAffiliateIdentifier(referringLink);

              if (insertAffiliateIdentifier) {
                await Purchases.setAttributes({"insert_affiliate" : insertAffiliateIdentifier});
              }

            } catch (err) {
              console.error('Error setting affiliate identifier:', err);
            }
          }
        }
      });

      return () => {
        branchSubscription();
      };
    }, [setInsertAffiliateIdentifier]);

  return <App />;
};

const RootComponent = () => {
  return (
    <DeepLinkIapProvider>
      <DeepLinkHandler />
    </DeepLinkIapProvider>
  );
};

AppRegistry.registerComponent(appName, () => RootComponent);

//...
```

#### Example with Iaptic / App Store Direct Integration / Google Play Direct Integration
```javascript
import branch from 'react-native-branch';
import {useDeepLinkIapProvider, DeepLinkIapProvider} from 'insert-affiliate-react-native-sdk';

const DeepLinkHandler = () => {
  const {setInsertAffiliateIdentifier} = useDeepLinkIapProvider();
  
  React.useEffect(() => {
    const branchSubscription = branch.subscribe(async ({error, params}) => {
      if (error) {
        console.error('Error from Branch:', error);
        return;
      }

      if (params['+clicked_branch_link']) {
        const referringLink = params['~referring_link'];
        if (referringLink) {
          try {
            await setInsertAffiliateIdentifier(referringLink);
            console.log('Affiliate identifier set successfully.');
          } catch (err) {
            console.error('Error setting affiliate identifier:', err);
          }
        }
      }
    });

    return () => branchSubscription();
  }, [setInsertAffiliateIdentifier]);

  return <App />;
};

const RootComponent = () => {
  return (
    <DeepLinkIapProvider>
      <DeepLinkHandler />
    </DeepLinkIapProvider>
  );
};
```

## Additional Features

### 1. Event Tracking (Beta)

The **InsertAffiliateReactNative SDK** now includes a beta feature for event tracking. Use event tracking to log key user actions such as signups, purchases, or referrals. This is useful for:
- Understanding user behaviour.
- Measuring the effectiveness of marketing campaigns.
- Incentivising affiliates for designated actions being taken by the end users, rather than just in app purchases (i.e. pay an affilaite for each signup).

At this stage, we cannot guarantee that this feature is fully resistant to tampering or manipulation.

#### Using `trackEvent`

To track an event, use the `trackEvent` function. Make sure to set an affiliate identifier first; otherwise, event tracking won’t work. Here’s an example:

```javascript
const {
  referrerLink,
  subscriptions,
  iapLoading,
  validatePurchaseWithIapticAPI,
  userId,
  userPurchase,
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

### 2. Short Codes (Beta)

#### What are Short Codes?

Short codes are unique, 10-character alphanumeric identifiers that affiliates can use to promote products or subscriptions. These codes are ideal for influencers or partners, making them easier to share than long URLs.

**Example Use Case**: An influencer promotes a subscription with the short code "JOIN12345" within their TikTok video's description. When users enter this code within your app during sign-up or before purchase, the app tracks the subscription back to the influencer for commission payouts.

For more information, visit the [Insert Affiliate Short Codes Documentation](https://docs.insertaffiliate.com/short-codes).

#### Setting a Short Code

Use the `setShortCode` method to associate a short code with an affiliate. This is ideal for scenarios where users enter the code via an input field, pop-up, or similar UI element.

Short codes must meet the following criteria:
- Exactly **10 characters long**.
- Contain only **letters and numbers** (alphanumeric characters).
- Replace {{ user_entered_short_code }} with the short code the user enters through your chosen input method, i.e. an input field / pop up element

```javascript
  import {
    DeepLinkIapProvider,
  } from 'insert-affiliate-react-native-sdk';

  const {
    setShortCode,
  } = useDeepLinkIapProvider();

  <Button
    title={'Set Short Code'}
    onPress={() => setShortCode('JOIN123456')}
  />
```
