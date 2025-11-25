# Branch.io Deep Linking Integration

This guide shows how to integrate InsertAffiliateReactNative SDK with Branch.io for deep linking attribution.

## Prerequisites

- [Branch SDK for React Native](https://help.branch.io/developers-hub/docs/react-native) installed and configured
- Create a Branch deep link and provide it to affiliates via the [Insert Affiliate dashboard](https://app.insertaffiliate.com/affiliates)

## Platform Setup

Complete the deep linking setup for Branch by following their official documentation:
- [Branch React Native SDK Integration Guide](https://help.branch.io/developers-hub/docs/react-native)

This covers:
- iOS: Info.plist configuration, AppDelegate setup, and universal links
- Android: AndroidManifest.xml intent filters and App Links
- Testing and troubleshooting

## Integration Examples

Choose the example that matches your IAP verification platform:

### Example with RevenueCat

```javascript
import React, { useEffect } from 'react';
import { AppRegistry } from 'react-native';
import branch from 'react-native-branch';
import Purchases from 'react-native-purchases';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier } = useDeepLinkIapProvider();

  useEffect(() => {
    const branchSubscription = branch.subscribe(async ({ error, params }) => {
      if (error) {
        console.error('Error from Branch:', error);
        return;
      }

      if (params['+clicked_branch_link']) {
        const referringLink = params['~referring_link'];
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
```

### Example with Apphud

```javascript
import React, { useEffect } from 'react';
import { AppRegistry } from 'react-native';
import branch from 'react-native-branch';
import Apphud from 'react-native-apphud';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier } = useDeepLinkIapProvider();

  useEffect(() => {
    const branchSubscription = branch.subscribe(async ({ error, params }) => {
      if (error) {
        console.error('Error from Branch:', error);
        return;
      }

      if (params['+clicked_branch_link']) {
        const referringLink = params['~referring_link'];
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
```

### Example with Iaptic

```javascript
import React, { useEffect } from 'react';
import { AppRegistry } from 'react-native';
import branch from 'react-native-branch';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier } = useDeepLinkIapProvider();

  useEffect(() => {
    const branchSubscription = branch.subscribe(async ({ error, params }) => {
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

AppRegistry.registerComponent(appName, () => RootComponent);
```

### Example with App Store / Google Play Direct Integration

```javascript
import React, { useEffect } from 'react';
import { AppRegistry } from 'react-native';
import branch from 'react-native-branch';
import { useDeepLinkIapProvider, DeepLinkIapProvider } from 'insert-affiliate-react-native-sdk';
import App from './App';
import { name as appName } from './app.json';

const DeepLinkHandler = () => {
  const { setInsertAffiliateIdentifier } = useDeepLinkIapProvider();

  useEffect(() => {
    const branchSubscription = branch.subscribe(async ({ error, params }) => {
      if (error) {
        console.error('Error from Branch:', error);
        return;
      }

      if (params['+clicked_branch_link']) {
        const referringLink = params['~referring_link'];
        if (referringLink) {
          try {
            await setInsertAffiliateIdentifier(referringLink);
            // Affiliate identifier is stored automatically for direct store integration
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

AppRegistry.registerComponent(appName, () => RootComponent);
```

## Testing

Test your Branch deep link integration:

```bash
# Test with your Branch link (iOS Simulator)
xcrun simctl openurl booted "https://your-app.app.link/abc123"

# Test with your Branch link (Android Emulator)
adb shell am start -W -a android.intent.action.VIEW -d "https://your-app.app.link/abc123"
```

## Troubleshooting

**Problem:** `~referring_link` is null
- **Solution:** Ensure Branch SDK is properly initialized before Insert Affiliate SDK
- Verify Branch link is properly configured with your app's URI scheme

**Problem:** Deep link opens browser instead of app
- **Solution:** Check Branch dashboard for associated domains configuration
- Verify your app's entitlements include the Branch link domain (iOS)
- Verify AndroidManifest.xml has correct intent filters (Android)

**Problem:** Deferred deep linking not working
- **Solution:** Make sure you're using `branch.subscribe()` correctly
- Test with a fresh app install (uninstall/reinstall)

## Next Steps

After completing Branch integration:
1. Test deep link attribution with a test affiliate link
2. Verify affiliate identifier is stored correctly
3. Make a test purchase to confirm tracking works end-to-end

[Back to Main README](../readme.md)
