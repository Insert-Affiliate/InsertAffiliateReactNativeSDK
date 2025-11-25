# Dynamic Offer Codes Complete Guide

Automatically apply discounts or trials when users come from specific affiliates using offer code modifiers.

## How It Works

When someone clicks an affiliate link or enters a short code linked to an offer (set up in the Insert Affiliate Dashboard), the SDK fills in `OfferCode` with the right modifier (like `_oneWeekFree`). You can then add this to your regular product ID to load the correct version of the subscription in your app.

## Setup in Insert Affiliate Dashboard

1. Go to [app.insertaffiliate.com/affiliates](https://app.insertaffiliate.com/affiliates)
2. Select the affiliate you want to configure
3. Click "View" to access the affiliate's settings
4. Assign an **iOS IAP Modifier** to the affiliate (e.g., `_oneWeekFree`, `_threeMonthsFree`)
5. Assign an **Android IAP Modifier** to the affiliate (e.g., `-oneweekfree`, `-threemonthsfree`)
6. Save the settings

Once configured, when users click that affiliate's links or enter their short codes, your app will automatically receive the modifier and can load the appropriate discounted product.

## Setup in App Store Connect (iOS)

Make sure you have created the corresponding subscription products in App Store Connect:
- Your base subscription (e.g., `oneMonthSubscription`)
- Promotional offer variants (e.g., `oneMonthSubscription_oneWeekFree`)

Both must be configured and published to at least TestFlight for testing.

## Setup in Google Play Console (Android)

There are multiple ways you can configure your products:

1. **Multiple Products Approach**: Create both a base and a promotional product:
   - Base product: `oneMonthSubscription`
   - Promo product: `oneMonthSubscription-oneweekfree`

2. **Single Product with Multiple Base Plans**: Create one product with multiple base plans, one with an offer attached

3. **Developer Triggered Offers**: Have one base product and apply the offer through developer-triggered offers

4. **Base Product with Intro Offers**: Have one base product that includes an introductory offer

**Important:** If using the Multiple Products Approach, ensure both products are activated and generate a release to at least Internal Testing.

## Implementation Examples

### RevenueCat Example

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

export default PurchaseHandler;
```

### RevenueCat Dashboard Configuration

1. Create separate offerings:
   - Base offering: `premium_monthly`
   - Modified offering: `premium_monthly_oneWeekFree`

2. Add both product IDs under different offerings in RevenueCat

3. Ensure modified products follow this naming pattern: `{baseProductId}_{cleanOfferCode}`

### Native react-native-iap Example

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
    try {
      let appAccountToken = null;

      // For iOS App Store Direct integration
      if (Platform.OS === 'ios') {
        appAccountToken = await returnUserAccountTokenAndStoreExpectedTransaction();
      }

      await requestSubscription({
        sku: productId,
        ...(appAccountToken ? { applicationUsername: appAccountToken } : {}),
      });
    } catch (error) {
      console.error('Purchase error:', error);
    }
  };

  useEffect(() => {
    if (connected) {
      fetchProducts();
    }
  }, [connected, OfferCode]);

  const primaryProduct = availableProducts[0];

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
        Premium Subscription
      </Text>

      {OfferCode && (
        <View style={{ backgroundColor: '#e3f2fd', padding: 10, marginBottom: 15, borderRadius: 8 }}>
          <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>
            Special Offer Applied: {OfferCode}
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
              Promotional pricing applied
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

export default NativeIAPPurchaseView;
```

## Key Features

1. **Dynamic Product Loading**: Automatically constructs product IDs using the offer code modifier
2. **Fallback Strategy**: If the promotional product isn't found, falls back to the base product
3. **Visual Feedback**: Shows users when promotional pricing is applied
4. **Cross-Platform**: Works on both iOS and Android with appropriate product naming

## Example Product Identifiers

**iOS (App Store Connect):**
- Base product: `oneMonthSubscription`
- With introductory discount: `oneMonthSubscription_oneWeekFree`
- With different offer: `oneMonthSubscription_threeMonthsFree`

**Android (Google Play Console):**
- Base product: `onemonthsubscription`
- With introductory discount: `onemonthsubscription-oneweekfree`
- With different offer: `onemonthsubscription-threemonthsfree`

## Best Practices

1. **Call in Purchase Views**: Always implement this logic in views where users can make purchases
2. **Handle Both Cases**: Ensure your app works whether an offer code is present or not
3. **Fallback**: Have a fallback to your base product if the dynamic product isn't found
4. **Platform-Specific Naming**: Use underscores (`_`) for iOS modifiers and hyphens (`-`) for Android modifiers

## Testing

1. **Set up test affiliate** with offer code modifier in Insert Affiliate dashboard
2. **Click test affiliate link** or enter short code
3. **Verify offer code** is stored:
   ```javascript
   const { OfferCode } = useDeepLinkIapProvider();
   console.log('Offer code:', OfferCode);
   ```
4. **Check dynamic product ID** is constructed correctly
5. **Complete test purchase** to verify correct product is purchased

## Troubleshooting

**Problem:** Offer code is null
- **Solution:** Ensure affiliate has offer code modifier configured in dashboard
- Verify user clicked affiliate link or entered short code before checking

**Problem:** Promotional product not found
- **Solution:** Verify promotional product exists in App Store Connect / Google Play Console
- Check product ID matches exactly (including the modifier)
- Ensure product is published to at least TestFlight (iOS) or Internal Testing (Android)

**Problem:** Always showing base product instead of promotional
- **Solution:** Ensure offer code is retrieved before fetching products
- Check that `OfferCode` is not null/undefined
- Verify the dynamic product identifier is correct

**Problem:** Purchase tracking not working with promotional product
- **Solution:** For App Store Direct, ensure you're using `returnUserAccountTokenAndStoreExpectedTransaction()`
- For RevenueCat/Apphud, verify `insert_affiliate` attribute is set correctly

## Next Steps

- Configure offer code modifiers for high-value affiliates
- Create promotional products in App Store Connect and Google Play Console
- Test the complete flow from link click to purchase
- Monitor affiliate performance in Insert Affiliate dashboard

[Back to Main README](../readme.md)
