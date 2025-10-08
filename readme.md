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

1. Install the NPM package and its required peer dependencies.
```bash
npm install insert-affiliate-react-native-sdk
```

2. Install the required peer dependencies:
```bash
npm install @react-native-async-storage/async-storage @react-native-clipboard/clipboard @react-native-community/netinfo react-native-device-info axios
```

### Required Dependencies

The SDK requires the following peer dependencies to function properly:

- **`@react-native-async-storage/async-storage`** (>= 1.0.0) - For persistent storage of affiliate identifiers and user data
- **`@react-native-clipboard/clipboard`** (>= 1.16.0) - For clipboard-based affiliate link detection (Insert Links feature)
- **`@react-native-community/netinfo`** (>= 11.4.0) - For network connectivity detection and system information collection
- **`react-native-device-info`** (>= 10.0.0) - For device information and system data collection
- **`axios`** (>= 1.0.0) - For API communication with Insert Affiliate services
- **`react`** (>= 16.0.0) - React framework
- **`react-native`** (>= 0.60.0) - React Native framework

**Note**: These dependencies must be installed in your app for the SDK to work. If any are missing, you'll get runtime errors when the SDK tries to use them.

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

### Verbose Logging (Optional)

By default, the SDK operates silently to avoid interrupting the user experience. However, you can enable verbose logging to see visual confirmation when affiliate attribution is processed. This is particularly useful for debugging during development or TestFlight testing.

#### Enable Verbose Logging

```javascript
const Child = () => {
  const { initialize, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) {
      // Enable verbose logging (second parameter)
      initialize("{{ your-company-code }}", true);
    }
  }, [initialize, isInitialized]);
}
```

**When verbose logging is enabled, you'll see detailed logs with the `[Insert Affiliate] [VERBOSE]` prefix that show:**

- **Initialization Process**: SDK startup, company code validation, AsyncStorage operations
- **Data Management**: User ID generation, referrer link storage, company code state management
- **Deep Link / Insert Link Processing**: Input validation, short code detection, API conversion process
- **API Communication**: Request/response details for all server calls
- **Event Tracking**: Event parameters, payload construction, success/failure status
- **Purchase Operations**: Transaction storage, token validation, webhook processing

**Example verbose output:**
```
[Insert Affiliate] [VERBOSE] Starting SDK initialization...
[Insert Affiliate] [VERBOSE] Company code provided: Yes
[Insert Affiliate] [VERBOSE] Verbose logging enabled
[Insert Affiliate] SDK initialized with company code: your-company-code
[Insert Affiliate] [VERBOSE] Company code saved to AsyncStorage
[Insert Affiliate] [VERBOSE] SDK marked as initialized
[Insert Affiliate] [VERBOSE] Loading stored data from AsyncStorage...
[Insert Affiliate] [VERBOSE] User ID found: Yes
[Insert Affiliate] [VERBOSE] Referrer link found: Yes
[Insert Affiliate] [VERBOSE] Company code found: Yes
```

**Benefits of verbose logging:**
- **Debug Deep Linking Issues**: See exactly what links are being processed and how they're converted
- **Monitor API Communication**: Track all server requests, responses, and error details
- **Identify Storage Problems**: Understand AsyncStorage read/write operations and state sync
- **Performance Insights**: Monitor async operation timing and identify bottlenecks
- **Integration Troubleshooting**: Quickly identify configuration or setup issues

⚠️ **Important**: Disable verbose logging in production builds to avoid exposing sensitive debugging information and to optimize performance.

### Attribution Timeout

You can configure how long an affiliate link attribution remains active after being clicked. This allows you to control the attribution window for commissions.

#### Basic Usage

When initializing the SDK, you can specify the attribution timeout in seconds:

```javascript
const Child = () => {
  const { initialize, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) {
      // Set attribution timeout to 7 days (7 * 24 * 60 * 60 = 604800 seconds)
      initialize(
        "{{ your-company-code }}", 
        false, // verbose logging
        false, // insert links enabled
        false, // insert links clipboard enabled  
        604800 // attribution timeout in seconds
      );
    }
  }, [initialize, isInitialized]);
}
```

#### Common Timeout Values

```javascript
// 1 day
initialize("your-company-code", false, false, false, 86400);

// 7 days (default for many platforms)
initialize("your-company-code", false, false, false, 604800);

// 30 days
initialize("your-company-code", false, false, false, 2592000);

// No timeout (attribution never expires)
initialize("your-company-code", false, false, false); // or pass null/undefined
```

#### Advanced Usage

The SDK provides methods to work with attribution timeouts:

```javascript
const {
  returnInsertAffiliateIdentifier,
  isAffiliateAttributionValid,
  getAffiliateStoredDate
} = useDeepLinkIapProvider();

// Get affiliate identifier (respects timeout)
const identifier = await returnInsertAffiliateIdentifier();

// Get affiliate identifier ignoring timeout
const rawIdentifier = await returnInsertAffiliateIdentifier(true);

// Check if attribution is still valid
const isValid = await isAffiliateAttributionValid();

// Get the date when affiliate was first stored
const storedDate = await getAffiliateStoredDate();
```

#### How It Works

1. **Attribution Storage**: When an affiliate link is clicked and processed, the SDK stores both the affiliate identifier and the current timestamp
2. **Timeout Check**: When `returnInsertAffiliateIdentifier()` is called, the SDK checks if the stored attribution is still within the timeout window
3. **Expired Attribution**: If the attribution has expired, the method returns `null` instead of the affiliate identifier
4. **Bypass Option**: You can bypass the timeout check by passing `true` to `returnInsertAffiliateIdentifier(true)`

This ensures that affiliates are only credited for purchases made within the specified attribution window, providing fair and accurate commission tracking.

### Insert Link and Clipboard Control (BETA)
We are currently beta testing our in-house deep linking provider, Insert Links, which generates links for use with your affiliates.

For larger projects where accuracy is critical, we recommend using established third-party deep linking platforms to generate the links you use within Insert Affiliate - such as Appsflyer or Branch.io, as described in the rest of this README.

If you encounter any issues while using Insert Links, please raise an issue on this GitHub repository or contact us directly at michael@insertaffiliate.com

#### Initialize with Insert Links

When using Insert Affiliate's built-in deep link handling (Insert Links), you can enable these features during initialization:

```javascript
const Child = () => {
  const { initialize, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) {
      initialize(
        "{{ your-company-code }}", 
        false, // Enable for debugging
        true,  // Enables Insert Links
        true,  // Enable Insert Links Clipboard access to avoid permission prompt
        604800 // Optional: Attribution timeout in seconds (7 days)
      );
    }
  }, [initialize, isInitialized]);
}
```

**When to use `insertLinksEnabled`:**
- Set to `true` (default: `false`) if you are using Insert Affiliate's built-in deep link and universal link handling (Insert Links)
- Set to `false` if you are using an external provider for deep links

**When to use `insertLinksClipboardEnabled`:**
- Set to `true` (default: `false`) if you are using Insert Affiliate's built-in deep links (Insert Links) **and** would like to improve the effectiveness of our deep links through the clipboard
- **Important caveat**: This will trigger a system prompt asking the user for permission to access the clipboard when the SDK initializes

**When to use `affiliateAttributionActiveTime`:**
- Set to a number in seconds to define how long affiliate attributions remain active
- Set to `null` or omit to disable attribution timeout (attribution never expires)
- Common values: 86400 (1 day), 604800 (7 days), 2592000 (30 days)


## In-App Purchase Setup [Required]
Insert Affiliate requires a Receipt Verification platform to validate in-app purchases. You must choose **one** of our supported partners:
- [RevenueCat](https://www.revenuecat.com/)
- [Iaptic](https://www.iaptic.com/account)
- [App Store Direct Integration](#option-3-app-store-direct-integration)
- [Google Play Store Direct Integration](#option-4-google-play-store-direct-integration)

### Option 1: RevenueCat Integration
#### Step 1. Code Setup
First, complete the [RevenueCat SDK installation](https://www.revenuecat.com/docs/getting-started/installation/reactnative). Then modify your `App.tsx`:

```javascript
import React, {useEffect} from 'react'; 
import {AppRegistry} from 'react-native';
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
                onPress={() => handleBuySubscription("oneMonthSubscription")}
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

Insert Affiliate requires a Deep Linking platform to create links for your affiliates. Our platform works with **any** deep linking provider. Below are examples for popular providers including Branch.io and AppsFlyer:
1. **Create a deep link** in your chosen third-party platform and pass it to our dashboard when an affiliate signs up. 
2. **Handle deep link clicks** in your app by passing the clicked link:
   ```javascript
   await setInsertAffiliateIdentifier(referringLink)
   ```
3. **Integrate with a Receipt Verification platform** by using the result from `setInsertAffiliateIdentifier` to log in or set your application’s username. Examples below include [**Iaptic**](https://github.com/Insert-Affiliate/InsertAffiliateReactNativeSDK?tab=readme-ov-file#example-with-iaptic) and [**RevenueCat**](https://github.com/Insert-Affiliate/InsertAffiliateReactNativeSDK?tab=readme-ov-file#example-with-revenuecat)



### Deep Linking with Insert Links

Insert Links by Insert Affiliate supports deferred deep linking into your app. This allows you to track affiliate attribution when end users are referred to your app by clicking on one of your affiliates Insert Links.

#### Initial Setup

1. Before you can use Insert Links, you must complete the setup steps in [our docs](https://docs.insertaffiliate.com/insert-links)

2. **Initialization** of the Insert Affiliate SDK with Insert Links

You must enable *insertLinksEnabled* when [initialising our SDK](https://github.com/Insert-Affiliate/InsertAffiliateReactNativeSDK?tab=readme-ov-file#initialize-with-insert-links)

**Handle Insert Links** in your React Native app

The React Native SDK handles deep links in ALL scenarios:

- **App Not Running (Cold Start)**: When user clicks a deep link and app is not running, the app launches and processes the URL
- **App Running (Warm Start)**: When user clicks a deep link while app is already running, processes the URL immediately  
- **App Backgrounded**: When user clicks a deep link while app is backgrounded, brings app to foreground and processes the URL
- **Automatic Processing**: Parses Insert Link URLs and sets affiliate identifiers without additional code

3. **Platform Specific** Setup

##### iOS Additional Setup (required)

To enable deep linking and universal links on iOS, you need to configure your app's Info.plist and AppDelegate files.

**AppDelegate Setup**

Update your `ios/YourApp/AppDelegate.mm` (or `AppDelegate.m`) file:

```objc
#import <React/RCTLinkingManager.h>

// Handle URL opening when app is already running (iOS 9+)
- (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)url
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  return [RCTLinkingManager application:application openURL:url options:options];
}

// Handle URL opening (iOS 8 and below - for backward compatibility)
- (BOOL)application:(UIApplication *)application openURL:(NSURL *)url
  sourceApplication:(NSString *)sourceApplication annotation:(id)annotation
{
  return [RCTLinkingManager application:application openURL:url
                      sourceApplication:sourceApplication annotation:annotation];
}

// Handle universal links (iOS 9+)
- (BOOL)application:(UIApplication *)application continueUserActivity:(NSUserActivity *)userActivity
 restorationHandler:(void(^)(NSArray * __nullable restorableObjects))restorationHandler
{
  return [RCTLinkingManager application:application
                   continueUserActivity:userActivity
                     restorationHandler:restorationHandler];
}
```

4. **Receipt Verification Integration Examples when Using Insert Links**

The SDK provides a callback mechanism that triggers whenever the affiliate identifier changes. This is perfect for integrating with receipt verification platforms.

##### With RevenueCat

Set up the callback to automatically update RevenueCat when the affiliate identifier changes:

```javascript
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import Purchases from 'react-native-purchases';

const App = () => {
  const { setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();

  useEffect(() => {
    // Set up callback to handle affiliate identifier changes
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        // Update RevenueCat with the affiliate identifier
        await Purchases.setAttributes({"insert_affiliate": identifier});
      }
    });

    // Cleanup on unmount
    return () => {
      setInsertAffiliateIdentifierChangeCallback(null);
    };
  }, []);

  return <YourAppContent />;
};
```

##### With Apphud

```javascript
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import Apphud from 'react-native-apphud';

const App = () => {
  const { setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();

  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        // Update Apphud with the affiliate identifier
        await Apphud.setUserProperty("insert_affiliate", identifier, false);
      }
    });

    return () => {
      setInsertAffiliateIdentifierChangeCallback(null);
    };
  }, []);

  return <YourAppContent />;
};
```

##### With Iaptic

```javascript
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import InAppPurchase from 'react-native-iaptic';

const App = () => {
  const { setInsertAffiliateIdentifierChangeCallback } = useDeepLinkIapProvider();

  useEffect(() => {
    setInsertAffiliateIdentifierChangeCallback(async (identifier) => {
      if (identifier) {
        // Initialize Iaptic with the affiliate identifier
        await InAppPurchase.initialize({
          iapProducts: iapProductsArray,
          validatorUrlString: "https://validator.iaptic.com/v3/validate?appName={{ your_iaptic_app_name }}&apiKey={{ your_iaptic_app_key_goes_here }}",
          applicationUsername: identifier
        });
      }
    });

    return () => {
      setInsertAffiliateIdentifierChangeCallback(null);
    };
  }, []);

  return <YourAppContent />;
};
```


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

### Deep Linking with AppsFlyer
To set up deep linking with AppsFlyer, follow these steps:

1. Create a [OneLink](https://support.appsflyer.com/hc/en-us/articles/208874366-Create-a-OneLink-link-for-your-campaigns) in AppsFlyer and pass it to our dashboard when an affiliate signs up.
  - Example: [Create Affiliate](https://docs.insertaffiliate.com/create-affiliate).
2. Initialize AppsFlyer SDK and set up deep link handling in your app.

#### Platform Setup
Complete the deep linking setup for AppsFlyer by following their official documentation:
- [AppsFlyer Deferred Deep Link Integration Guide](https://dev.appsflyer.com/hc/docs/deeplinkintegrate)

This covers all platform-specific configurations including:
- iOS: Info.plist configuration, AppDelegate setup, and universal links
- Android: AndroidManifest.xml intent filters, MainActivity setup, and App Links
- Testing and troubleshooting for both platforms

#### Example with RevenueCat

```javascript
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import Purchases from 'react-native-purchases';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) return;

    // Initialize AppsFlyer
    const initAppsFlyer = async () => {
      try {
        const initOptions = {
          devKey: 'your-appsflyer-dev-key',
          isDebug: true,
          appId: Platform.OS === 'ios' ? 'your-ios-app-id' : 'your-android-package-name',
        };

        await appsFlyer.initSdk(initOptions);
      } catch (error) {
        console.error('AppsFlyer initialization error:', error);
      }
    };

    // Handle deep link data
    const handleDeepLink = async (deepLinkData) => {
      if (deepLinkData && deepLinkData.data) {
        let referringLink = deepLinkData.data.link || deepLinkData.data.deep_link_value;

        if (referringLink) {
          try {
            let insertAffiliateIdentifier = await setInsertAffiliateIdentifier(referringLink);

            if (insertAffiliateIdentifier) {
              await Purchases.setAttributes({"insert_affiliate": insertAffiliateIdentifier});
            }
          } catch (err) {
            console.error('Error setting affiliate identifier:', err);
          }
        }
      }
    };

    // Listen for both deep link types
    appsFlyer.onDeepLink(handleDeepLink);
    appsFlyer.onAppOpenAttribution(handleDeepLink);

    initAppsFlyer();
  }, [setInsertAffiliateIdentifier, isInitialized]);

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
```

#### Example with Iaptic / App Store Direct Integration / Google Play Direct Integration

```javascript
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) return;

    // Initialize AppsFlyer
    const initAppsFlyer = async () => {
      try {
        const initOptions = {
          devKey: 'your-appsflyer-dev-key',
          isDebug: true,
          appId: Platform.OS === 'ios' ? 'your-ios-app-id' : 'your-android-package-name',
        };

        await appsFlyer.initSdk(initOptions);
      } catch (error) {
        console.error('AppsFlyer initialization error:', error);
      }
    };

    // Handle deep link data
    const handleDeepLink = async (deepLinkData) => {
      if (deepLinkData && deepLinkData.data) {
        let referringLink = deepLinkData.data.link || deepLinkData.data.deep_link_value;

        if (referringLink) {
          try {
            await setInsertAffiliateIdentifier(referringLink);
          } catch (err) {
            console.error('Error setting affiliate identifier:', err);
          }
        }
      }
    };

    // Listen for both deep link types
    appsFlyer.onDeepLink(handleDeepLink);
    appsFlyer.onAppOpenAttribution(handleDeepLink);

    initAppsFlyer();
  }, [setInsertAffiliateIdentifier, isInitialized]);

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

To track an event, use the `trackEvent` function. Make sure to set an affiliate identifier first; otherwise, event tracking won't work. Here's an example:

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

### 2. Discounts for Users → Offer Codes / Dynamic Product IDs

The SDK allows you to apply dynamic modifiers to in-app purchases based on whether the app was installed via an affiliate. These modifiers can be used to swap the default product ID for a discounted or trial-based one - similar to applying an offer code.

#### How It Works

When a user clicks an affiliate link or enters a short code linked to an offer (set up in the **Insert Affiliate Dashboard**), the SDK auto-populates the `OfferCode` field with a relevant modifier (e.g., `_oneWeekFree`). You can append this to your base product ID to dynamically display the correct subscription.

#### Basic Usage

##### 1. Automatic Offer Code Fetching
If an affiliate short code is stored, the SDK automatically fetches and saves the associated offer code modifier.

##### 2. Access the Offer Code Modifier
The offer code modifier is available through the context:

```javascript
const { OfferCode } = useDeepLinkIapProvider();
```

##### Setup Requirements

#### Insert Affiliate Setup Instructions

1. Go to your Insert Affiliate dashboard at [app.insertaffiliate.com/affiliates](https://app.insertaffiliate.com/affiliates)
2. Select the affiliate you want to configure
3. Click "View" to access the affiliate's settings
4. Assign an iOS IAP Modifier to the affiliate (e.g., `_oneWeekFree`, `_threeMonthsFree`)
5. Assign an Android IAP Modifier to the affiliate (e.g., `-oneweekfree`, `-threemonthsfree`)
5. Save the settings

Once configured, when users click that affiliate's links or enter their short codes, your app will automatically receive the modifier and can load the appropriate discounted product.

#### App Store Connect Configuration
1. Create both a base and a promotional product:
   - Base product: `oneMonthSubscription`
   - Promo product: `oneMonthSubscription_oneWeekFree`
2. Ensure **both** products are approved and available for sale.

#### Google Play Console Configuration
There are multiple ways you can configure your products in Google Play Console:

1. **Multiple Products Approach**: Create both a base and a promotional product:
   - Base product: `oneMonthSubscription`
   - Promo product: `oneMonthSubscription-oneweekfree`

2. **Single Product with Multiple Base Plans**: Create one product with multiple base plans, one with an offer attached

3. **Developer Triggered Offers**: Have one base product and apply the offer through developer-triggered offers

4. **Base Product with Intro Offers**: Have one base product that includes an introductory offer

Any of these approaches are suitable and work with the SDK. The important part is that your product naming follows the pattern where the offer code modifier can be appended to identify the promotional version.

**If using the Multiple Products Approach:**
- Ensure **both** products are activated and available for purchase.
- Generate a release to at least **Internal Testing** to make the products available in your current app build

**Product Naming Pattern:**
- Follow the pattern: `{baseProductId}{OfferCode}`
- Example: `oneMonthSubscription` + `_oneWeekFree` = `oneMonthSubscription_oneWeekFree`

---

#### RevenueCat Dashboard Configuration

#### RevenueCat Dashboard Configuration:
1. Create separate offerings:
   - Base offering: `premium_monthly`
   - Modified offering: `premium_monthly_oneWeekFree`

2. Add both product IDs under different offerings in RevenueCat.

3. Ensure modified products follow this naming pattern: {baseProductId}_{cleanOfferCode}. e.g. premium_monthly_oneWeekFree


### Integration Example
```javascript
import React, { useEffect, useState } from 'react';
import { View, Button, Text } from 'react-native';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import Purchases from 'react-native-purchases';

const PurchaseHandler = () => {
  const { OfferCode } = useDeepLinkIapProvider();
  const [subscriptions, setSubscriptions] = useState([]);

  const fetchSubscriptions = async () => {
    const offerings = await Purchases.getOfferings();
    let packagesToUse = [];

    if (OfferCode) {
    

      // Construct modified product IDs from base products
      const baseProducts = offerings.current.availablePackages;

      for (const basePackage of baseProducts) {
        const baseProductId = basePackage.product.identifier;
        const modifiedProductId = `${baseProductId}_${OfferCode}`;

        // Search all offerings for the modified product
        const allOfferings = Object.values(offerings.all);
        let foundModified = false;

        for (const offering of allOfferings) {
          const modifiedPackage = offering.availablePackages.find(pkg =>
            pkg.product.identifier === modifiedProductId
          );

          if (modifiedPackage) {
            packagesToUse.push(modifiedPackage);
            foundModified = true;
            break;
          }
        }

        // Fallback to base product if no modified version
        if (!foundModified) {
          packagesToUse.push(basePackage);
        }
      }
    } else {
      packagesToUse = offerings.current.availablePackages;
    }

    setSubscriptions(packagesToUse);
  };

  const handlePurchase = async (subscriptionPackage) => {
    try {
      await Purchases.purchasePackage(subscriptionPackage);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, [OfferCode]);

  return (
    <View>
      {subscriptions.map((pkg) => (
        <Button
          key={pkg.identifier}
          title={`Buy: ${pkg.product.identifier}`}
          onPress={() => handlePurchase(pkg)}
        />
      ))}
      {OfferCode && (
        <Text>Special offer applied: {OfferCode}</Text>
      )}
    </View>
  );
};
```
---

#### Native Receipt Verification Example

For apps using `react-native-iap` directly:

```javascript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, Platform } from 'react-native';
import { useDeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import { 
  initConnection, 
  getSubscriptions, 
  requestSubscription,
  useIAP 
} from 'react-native-iap';

const NativeIAPPurchaseView = () => {
  const { OfferCode, returnUserAccountTokenAndStoreExpectedTransaction } = useDeepLinkIapProvider();
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { currentPurchase, connected } = useIAP();
  
  const baseProductIdentifier = "oneMonthSubscription";
  
  // Dynamic product identifier that includes offer code
  const dynamicProductIdentifier = OfferCode 
    ? `${baseProductIdentifier}${OfferCode}`  // e.g., "oneMonthSubscription_oneWeekFree"
    : baseProductIdentifier;

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      // Try to fetch the dynamic product first
      let productIds = [dynamicProductIdentifier];
      
      // Also include base product as fallback
      if (OfferCode) {
        productIds.push(baseProductIdentifier);
      }
      
      const products = await getSubscriptions({ skus: productIds });
      
      // Prioritize the dynamic product if it exists
      let sortedProducts = products;
      if (OfferCode && products.length > 1) {
        sortedProducts = products.sort((a, b) => 
          a.productId === dynamicProductIdentifier ? -1 : 1
        );
      }
      
      setAvailableProducts(sortedProducts);
      console.log(`Loaded products for: ${productIds.join(', ')}`);
      
    } catch (error) {
      try {
        // Fallback logic
        const baseProducts = await getSubscriptions({ skus: [baseProductIdentifier] });
        setAvailableProducts(baseProducts);
      } catch (fallbackError) {
        console.error('Failed to fetch base products:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (productId) => {
    // Implement the purchase handling logic as outlined in the remaining SDK integration steps.
  };

  useEffect(() => {
    if (connected) {
      fetchProducts();
    }
  }, [connected, OfferCode]);;

  const primaryProduct = availableProducts[0];

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Premium Subscription
      </Text>
      
      {OfferCode && (
        <View style={{ backgroundColor: '#e3f2fd', padding: 10, marginBottom: 15, borderRadius: 8 }}>
          <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>
            🎉 Special Offer Applied: {OfferCode}
          </Text>
        </View>
      )}
      
      {loading ? (
        <Text>Loading products...</Text>
      ) : primaryProduct ? (
        <View>
          <Text style={{ fontSize: 16, marginBottom: 5 }}>
            {primaryProduct.title}
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 5 }}>
            Price: {primaryProduct.localizedPrice}
          </Text>
          <Text style={{ fontSize: 12, color: '#999', marginBottom: 15 }}>
            Product ID: {primaryProduct.productId}
          </Text>
          
          <Button
            title={loading ? "Processing..." : "Subscribe Now"}
            onPress={() => handlePurchase(primaryProduct.productId)}
            disabled={loading}
          />
          
          {primaryProduct.productId === dynamicProductIdentifier && OfferCode && (
            <Text style={{ fontSize: 12, color: '#4caf50', marginTop: 10 }}>
              ✓ Promotional pricing applied
            </Text>
          )}
        </View>
      ) : (
        <View>
          <Text style={{ color: '#f44336', marginBottom: 10 }}>
            Product not found: {dynamicProductIdentifier}
          </Text>
          <Button
            title="Retry"
            onPress={fetchProducts}
          />
        </View>
      )}
      
      {availableProducts.length > 1 && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>
            Other Options:
          </Text>
          {availableProducts.slice(1).map((product) => (
            <Button
              key={product.productId}
              title={`${product.title} - ${product.localizedPrice}`}
              onPress={() => handlePurchase(product.productId)}
            />
          ))}
        </View>
      )}
    </View>
  );
};
```

##### Key Features of Native IAP Integration:

1. **Dynamic Product Loading**: Automatically constructs product IDs using the offer code modifier
2. **Fallback Strategy**: If the promotional product isn't found, falls back to the base product
3. **Visual Feedback**: Shows users when promotional pricing is applied
4. **Error Handling**: Graceful handling when products aren't available


### 3. Short Codes (Beta)

#### What are Short Codes?

Short codes are unique identifiers that affiliates can use to promote products or subscriptions. These codes are ideal for influencers or partners, making them easier to share than long URLs.

**Example Use Case**: An influencer promotes a subscription with the short code "JOIN12345" within their TikTok video's description. When users enter this code within your app during sign-up or before purchase, the app tracks the subscription back to the influencer for commission payouts.

For more information, visit the [Insert Affiliate Short Codes Documentation](https://docs.insertaffiliate.com/short-codes).

#### Setting a Short Code

Use the `setShortCode` method to associate a short code with an affiliate. This is ideal for scenarios where users enter the code via an input field, pop-up, or similar UI element.

Short codes must meet the following criteria:
- Between **3-25 characters long**.
- Contain only **letters, numbers, and underscores** (alphanumeric characters and underscores).
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
    onPress={() => setShortCode('JOIN_123')}
  />
```
