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

Follow the steps below to install the SDK.

#### Step 1: Initialisation in `App.tsx`

First, wrap your with our provider and call the `initialize` method early in your app's lifecycle:

```javascript
const Child = () => {
  const {
    referrerLink,
    subscriptions,
    iapLoading,
    validatePurchaseWithIapticAPI,
    userId,
    userPurchase,
    trackEvent,
    initialize,
    isInitialized,
  } = useDeepLinkIapProvider();

  useEffect(() => {
    initialize("{{ your-company-code }}");
  }, [initialize, isInitialized]);
  
  // ...
}

const App = () => {
  return (
    <DeepLinkIapProvider>
      <Child />
    </DeepLinkIapProvider>
  );
};
```
- Replace `{{ your_company_code }}` with the unique company code associated with your Insert Affiliate account. You can find this code in your dashboard under [Settings](http://app.insertaffiliate.com/settings).

## In-App Purchase Setup [Required]
Insert Affiliate requires a Receipt Verification platform to validate in-app purchases. You must choose **one** of our supported partners:
- [RevenueCat](https://www.revenuecat.com/)
- [Iaptic](https://www.iaptic.com/account)

### Option 1: RevenueCat Integration
#### Step 1. Code Setup
First, complete the [RevenueCat SDK installation](https://www.revenuecat.com/docs/getting-started/installation/reactnative). Then modify your `App.tsx`:

```javascript
import {
  DeepLinkIapProvider,
  useDeepLinkIapProvider,
} from 'insert-affiliate-react-native-sdk';

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
                    console.log('Logging into RevenueCat...');
                    const { customerInfo, created } = await Purchases.logIn(affiliateIdentifier);
                    
                    if (created) {
                        console.log('New user created in RevenueCat:', customerInfo);
                    }
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

3. In your [Insert Affiliate dashboard settings](https://app.insertaffiliate.com/settings):
   - Navigate to the verification settings
   - Set the in-app purchase verification method to `RevenueCat`

4. Back in your Insert Affiliate dashboard:
   - Locate the `RevenueCat Webhook Authentication Header` value
   - Copy this value
   - Paste it as the Authorization header value in your RevenueCat webhook configuration


### Option 2: Iaptic Integration
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
    // Wrapped application code from the previous step...
    <DeepLinkIapProvider>
      <Child />
    </DeepLinkIapProvider>
  );
};

export default App;
```
- Replace `{{ your_iaptic_app_id }}` with your **Iaptic App ID**. You can find this [here](https://www.iaptic.com/account).
- Replace `{{ your_iaptic_app_name }}` with your **Iaptic App Name**. You can find this [here](https://www.iaptic.com/account).
- Replace `{{ your_iaptic_public_key }}` with your **Iaptic Public Key**. You can find this [here](https://www.iaptic.com/settings).
- Replace `{{ your_company_code }}` with the unique company code associated with your Insert Affiliate account. You can find this code in your dashboard under [Settings](http://app.insertaffiliate.com/settings).

## Deep Link Setup [Required]

### Step 1: Add the Deep Linking Platform Dependency

In this example, the deep linking functionality is implemented using [Branch.io](https://dashboard.branch.io/).

Any alternative deep linking platform can be used by passing the referring link to ```InsertAffiliateSwift.setInsertAffiliateIdentifier(referringLink: "{{ link }}")``` as in the below Branch.io example

After setting up your Branch integration, add the following code to your ```App.tsx```

#### Example with RevenueCat
```javascript
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

//...
    const {setInsertAffiliateIdentifier, returnInsertAffiliateIdentifier} = useDeepLinkIapProvider();
    
    useEffect(() => {
      const branchSubscription = branch.subscribe(async ({error, params}) => {
        if (error) {
          console.error('Error from Branch:', error);
          return;
        }

        if (!params) {
          return
        }
        if (params['+clicked_branch_link']) {
          const referringLink = params['~referring_link'];
          if (referringLink) {
            try {
              await setInsertAffiliateIdentifier(referringLink);

              let insertAffiliateIdentifier = await returnInsertAffiliateIdentifier();
              if (insertAffiliateIdentifier) {
                const { customerInfo, created } = await Purchases.logIn(insertAffiliateIdentifier);
              }

            } catch (err) {
              console.error('Error setting affiliate identifier:', err);
            }
          }
        }
      });

      // Cleanup the subscription on component unmount
      return () => {
        branchSubscription();
      };
    }, [setInsertAffiliateIdentifier, isInitialized]);
//...
```

#### Example with Iaptic
```javascript
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
