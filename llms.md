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

3. **BundleInfoSection**: Displays bundle name, description, and bundle form for non-customizable or single-product bundles
    - **Required for**: Bundle detail pages when bundle is NOT customizable OR when `bundle.selectionType === 'single_product'`
    - **When to use**:
        - Use when `!bundle.configurable` (non-customizable bundles)
        - Use when `bundle.selectionType === 'single_product'` (single product selection bundles)
    - **Props**: `bundle: Bundle`, `groups: BundleGroup[]`
    - **Customization**: You can style the container and typography, but the component logic must remain intact

4. **CustomizeBundleSection**: Displays complete bundle customization interface with item selection, quantity controls, and checkout
    - **Required for**: Customizable bundle pages (except single-product selection bundles)
    - **When to use**:
        - Use when `bundle.configurable === true` AND `bundle.selectionType !== 'single_product'`
        - This handles multi-item selection bundles with full customization features
    - **Props**:
        - `bundle: Bundle` (required) - The bundle data object from Subbly API
        - `groupItemsByProduct?: boolean` - Groups items by their parent product instead of showing a flat list. When true, displays items organized under product cards with variant selectors
        - `allowMultipleItemsInGroup?: boolean` - Controls whether users can select multiple variants from the same product group. When false, selecting a new variant replaces the previous selection from that product
    - **Behavior consequences**:
        - Setting `groupItemsByProduct: true` switches from flat item list to product-grouped display
        - Setting `allowMultipleItemsInGroup: false` enforces single variant selection per product, preventing duplicate product types in the bundle
        - The component automatically uses grouped display when `bundle.selectionType` is `'single_product'`, regardless of the `groupItemsByProduct` prop
    - **Placement**: Full-width component with product grid and sidebar. Has built-in `container mx-auto`. Place it in your main content container, not in narrow sections or nested columns.
    - **Customization**: You can style the container and grid layout, but the bundle configuration logic, validation rules, and cart integration must remain intact

5. **AddToCartButton**: Handles adding products or bundles to the cart
    - **Required for**: Any page with add-to-cart functionality
    - **Props**: `payload: ConfigureItemPayload`
    - **Customization**: You can style the button appearance and provide custom children, but the cart logic must remain intact
