# AppsFlyer Deep Linking Integration

This guide shows how to integrate InsertAffiliateReactNative SDK with AppsFlyer for deep linking attribution.

## Prerequisites

- [AppsFlyer SDK for React Native](https://dev.appsflyer.com/hc/docs/react-native-plugin) installed and configured
- Create an AppsFlyer OneLink and provide it to affiliates via the [Insert Affiliate dashboard](https://app.insertaffiliate.com/affiliates)

## Platform Setup

Complete the deep linking setup for AppsFlyer by following their official documentation:
- [AppsFlyer Deferred Deep Link Integration Guide](https://dev.appsflyer.com/hc/docs/deeplinkintegrate)

This covers all platform-specific configurations including:
- iOS: Info.plist configuration, AppDelegate setup, and universal links
- Android: AndroidManifest.xml intent filters, MainActivity setup, and App Links
- Testing and troubleshooting for both platforms

## Integration Examples

Choose the example that matches your IAP verification platform:

### Example with RevenueCat

```javascript
import React, { useEffect } from 'react';
import { AppRegistry, Platform } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import Purchases from 'react-native-purchases';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) return;

    // Initialize AppsFlyer
    const initAppsFlyer = async () => {
      try {
        const initOptions = {
          devKey: 'YOUR_APPSFLYER_DEV_KEY',
          isDebug: true,
          appId: Platform.OS === 'ios' ? 'YOUR_IOS_APP_ID' : 'YOUR_ANDROID_PACKAGE_NAME',
        };

        await appsFlyer.initSdk(initOptions);
      } catch (error) {
        console.error('AppsFlyer initialization error:', error);
      }
    };

    // Handle deep link data
    const handleDeepLink = async (deepLinkData) => {
      if (deepLinkData && deepLinkData.data) {
        const referringLink = deepLinkData.data.link || deepLinkData.data.deep_link_value;

        if (referringLink) {
          try {
            const insertAffiliateIdentifier = await setInsertAffiliateIdentifier(referringLink);

            if (insertAffiliateIdentifier) {
              await Purchases.setAttributes({ "insert_affiliate": insertAffiliateIdentifier });
            }
          } catch (err) {
            console.error('Error setting affiliate identifier:', err);
          }
        }
      }
    };

    // Listen for all deep link types
    appsFlyer.onDeepLink(handleDeepLink);
    appsFlyer.onAppOpenAttribution(handleDeepLink);
    appsFlyer.onInstallConversionData(handleDeepLink);

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

**Replace the following:**
- `YOUR_APPSFLYER_DEV_KEY` with your AppsFlyer Dev Key
- `YOUR_IOS_APP_ID` with your iOS App ID (numbers only, e.g., "123456789")
- `YOUR_ANDROID_PACKAGE_NAME` with your Android package name

### Example with Apphud

```javascript
import React, { useEffect } from 'react';
import { AppRegistry, Platform } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import Apphud from 'react-native-apphud';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) return;

    const initAppsFlyer = async () => {
      try {
        const initOptions = {
          devKey: 'YOUR_APPSFLYER_DEV_KEY',
          isDebug: true,
          appId: Platform.OS === 'ios' ? 'YOUR_IOS_APP_ID' : 'YOUR_ANDROID_PACKAGE_NAME',
        };

        await appsFlyer.initSdk(initOptions);
      } catch (error) {
        console.error('AppsFlyer initialization error:', error);
      }
    };

    const handleDeepLink = async (deepLinkData) => {
      if (deepLinkData && deepLinkData.data) {
        const referringLink = deepLinkData.data.link || deepLinkData.data.deep_link_value;

        if (referringLink) {
          try {
            const insertAffiliateIdentifier = await setInsertAffiliateIdentifier(referringLink);

            if (insertAffiliateIdentifier) {
              await Apphud.setUserProperty("insert_affiliate", insertAffiliateIdentifier, false);
            }
          } catch (err) {
            console.error('Error setting affiliate identifier:', err);
          }
        }
      }
    };

    appsFlyer.onDeepLink(handleDeepLink);
    appsFlyer.onAppOpenAttribution(handleDeepLink);
    appsFlyer.onInstallConversionData(handleDeepLink);

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

### Example with Iaptic / Store Direct Integration

```javascript
import React, { useEffect } from 'react';
import { AppRegistry, Platform } from 'react-native';
import appsFlyer from 'react-native-appsflyer';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier, isInitialized } = useDeepLinkIapProvider();

  useEffect(() => {
    if (!isInitialized) return;

    const initAppsFlyer = async () => {
      try {
        const initOptions = {
          devKey: 'YOUR_APPSFLYER_DEV_KEY',
          isDebug: true,
          appId: Platform.OS === 'ios' ? 'YOUR_IOS_APP_ID' : 'YOUR_ANDROID_PACKAGE_NAME',
        };

        await appsFlyer.initSdk(initOptions);
      } catch (error) {
        console.error('AppsFlyer initialization error:', error);
      }
    };

    const handleDeepLink = async (deepLinkData) => {
      if (deepLinkData && deepLinkData.data) {
        const referringLink = deepLinkData.data.link || deepLinkData.data.deep_link_value;

        if (referringLink) {
          try {
            await setInsertAffiliateIdentifier(referringLink);
            // Affiliate identifier is stored automatically for Iaptic/direct store integration
          } catch (err) {
            console.error('Error setting affiliate identifier:', err);
          }
        }
      }
    };

    appsFlyer.onDeepLink(handleDeepLink);
    appsFlyer.onAppOpenAttribution(handleDeepLink);
    appsFlyer.onInstallConversionData(handleDeepLink);

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

## Deep Link Listener Types

AppsFlyer provides three types of deep link callbacks:

| Callback | When It Fires | Use Case |
|----------|---------------|----------|
| `onDeepLink` | App opened via deep link (app already installed) | Direct attribution |
| `onAppOpenAttribution` | App opened via deep link with attribution data | Re-engagement campaigns |
| `onInstallConversionData` | First app launch after install | Deferred deep linking |

For comprehensive affiliate tracking, we recommend listening to all three as shown in the examples above.

## Testing

Test your AppsFlyer deep link integration:

```bash
# Test with your OneLink URL (iOS Simulator)
xcrun simctl openurl booted "https://your-app.onelink.me/abc123"

# Test with your OneLink URL (Android Emulator)
adb shell am start -W -a android.intent.action.VIEW -d "https://your-app.onelink.me/abc123"
```

## Troubleshooting

**Problem:** Attribution callback not firing
- **Solution:** Ensure AppsFlyer SDK is initialized with correct dev key and app ID
- Check AppsFlyer dashboard to verify OneLink is active
- Verify `isInitialized` is `true` before setting up listeners

**Problem:** Deep link parameters not captured
- **Solution:** Verify deep link contains correct parameters in AppsFlyer dashboard
- Check Info.plist has correct URL schemes and associated domains (iOS)
- Check AndroidManifest.xml has correct intent filters (Android)

**Problem:** Deferred deep linking not working
- **Solution:** Make sure `onInstallConversionData` listener is set up
- Test with a fresh app install (uninstall/reinstall)
- Verify AppsFlyer's "Deferred Deep Linking" is enabled in dashboard

**Problem:** `deep_link_value` is undefined
- **Solution:** Ensure you're accessing the correct property path in the callback data
- Log the full `deepLinkData` object to see available fields

## Next Steps

After completing AppsFlyer integration:
1. Test deep link attribution with a test affiliate link
2. Verify affiliate identifier is stored correctly
3. Make a test purchase to confirm tracking works end-to-end

[Back to Main README](../readme.md)
