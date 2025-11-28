# Subbly E-commerce Integration

This document explains how to integrate with the Subbly platform to retrieve product information and manage the shopping
cart in your Next.js application.

## General Information

- By default you are using `addToCart` method from a `useSubblyCart` hook from the `@subbly/react` package, but users
  sometimes can ask to add a direct link to check. In that case use `buyLink` from `useBuyLink` hook from the
  `@subbly/react` package. For server side you can use `createBuyLink` from `@subbly/kit/cart` with the same input properties as `useBuyLink`
- All prices are defined in integers(cents), not decimals.
- When creating cart icon or cart counter, use these CSS classes to connect them with Subbly cart:
  `subbly-cart-product-count`, `subbly-cart`.
- These classes will automatically toggle cart widget and update cart counter when items are added or removed from the
  cart.
- If you see that in the existing code the cart icon or cart counter is not working, check if these classes are used and
  propose to add them.
- In VERY RARE CASES, you can update these classes inside `src/lib/subbly/subbly-script.tsx` file with the
  `cartToggleEl` and `cartCountEl` properties.

## Subbly integration tools

### `@subbly/react` package

`@subbly/react` provides tools to:

- conveniently fetch data from Subbly storefront API;
- use premade forms for specific product types;
- re-shape the data using hooks and helper functions;
- render formatted data in components;

## Currency Formatting

The application uses a custom `useFormatAmount` hook from `@/hooks/use-format-amount` for currency formatting.

- `formatAmount(amountInCents: number): string` - Formats an integer amount (in cents) to a localized currency string

## Component Usage Guidelines

1. **ProductInfoSection**: Displays product name, description, and product form (variants, plans, quantity selector)
    - **Required for**: Product detail pages
    - **Props**: `product: Product`
    - **Customization**: You can style the container and typography, but the component logic must remain intact

2. **ProductGallerySection**: Displays product images in a carousel with thumbnails
    - **Required for**: Product and bundle detail pages
    - **Props**: `images: ProductImage[]`, `productName: string`
    - **Customization**: You can style the gallery appearance, but the carousel functionality must remain intact

3. **CustomizeBundleSection**: Unified bundle component that handles ALL bundle types with automatic mode detection

   - **Location**: `src/components/subbly/bundle/customize-bundle-section.tsx`
   - **Required for**: All bundle detail pages
   - **Automatic Mode Detection**: Component automatically detects bundle type and renders appropriate UI:
     - **Fixed Mode** (`bundle.selectionType === null`): Non-customizable bundles with direct add to cart and optional plan selection
     - **Single-Product Mode** (`bundle.selectionType === 'single_product'`): Group-based selection with one variant per product group, uses VariantSelector for better UX
     - **Multi-Product Mode** (`bundle.selectionType === 'variant' or 'product'`): Full customization with item selection, quantity controls, preferences, receipt, and validation
   - **Props**:
     - `bundle: Bundle` (required) - The bundle data object from Subbly API
     - `groupItemsByProduct?: boolean` - Only applies to Multi-Product mode. Groups items by their parent product instead of showing a flat list
     - `allowMultipleItemsInGroup?: boolean` - Only applies to Multi-Product mode and when `groupItemsByProduct` enabled. Controls whether users can select multiple variants from the same product.
   - **Mode Behaviors**:
     - **Fixed Mode**: Shows plan selector (if multiple plans exist) and add to cart button. Uses `useBundleForm` hook
     - **Single-Product Mode**: Shows group selection with VariantSelector (radio or dropdown), preferences, plan selector, and add to cart. Uses `useBundleForm` + `useBundleProductGroupedItemsForm` hooks. Renders single-column layout similar to product detail pages
     - **Multi-Product Mode**: Full customization interface with size selection, preferences, item selection, selected items sidebar, receipt, and validation. Uses `useBundleForm` + `useBundleReceipt` + `useBundleValidation` hooks. Renders one-step or two-step layout based on `bundle.appearanceType`
   - **Appearance Type Support** (Multi-Product mode only):
     - `one_step`: All options visible in two-column layout (items left, summary right)
     - `two_step`: Progressive disclosure (Step 1: preferences/size/plan, Step 2: item selection)
     - `after_checkout`: Items selected after checkout
     - `without_ruleset`: No size selection, auto-match ruleset
   - **Customization**: The component uses internal layouts (FixedLayout, SingleProductLayout, OneStepLayout, TwoStepLayout) that can be styled, but core logic must remain intact
   - **ProductGallerySection Rendering**: On bundle detail pages, render `ProductGallerySection` alongside `CustomizeBundleSection` only when:
     - `bundle.selectionType === null` (Fixed Mode) - shows bundle images in gallery format
     - `bundle.selectionType === 'single_product'` (Single-Product Mode) - shows bundle images in gallery format
     - Do NOT render `ProductGallerySection` for Multi-Product mode (`selectionType === 'variant'` or `'product'`) as items have their own images in the selection UI

4. **AddToCartButton**: Handles adding products or bundles to the cart
   - **Required for**: Any page with add-to-cart functionality
   - **Props**: `payload: ConfigureItemPayload`
   - **Customization**: You can style the button appearance and provide custom children, but the cart logic must remain intact
