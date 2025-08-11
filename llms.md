# Subbly E-commerce Integration

This document explains how to integrate with the Subbly platform to retrieve product information and manage the shopping
cart in your Next.js application.

## General Information

- By default you are using `addToCart` method from a `useSubblyCart` hook from the `@subbly/react` package, but users
  sometimes can ask to add a direct link to check. In that case use `buyLink` from `useBuyLink` hook from the
  `@subbly/react` package.
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

For detailed instructions on how to use `@subbly/react` package refer to [@subbly/react usage guidelines](/node_modules/@subbly/react/guidelines/subbly-ecommerce-ingetration.md) 

## Component Usage Guidelines

1. **ProductInfoSection**: Displays product name, description, and product form (variants, plans, quantity selector)
    - **Required for**: Product detail pages
    - **Props**: `product: Product`
    - **Customization**: You can style the container and typography, but the component logic must remain intact

2. **ProductGallerySection**: Displays product images in a carousel with thumbnails
    - **Required for**: Product and bundle detail pages
    - **Props**: `images: ProductImage[]`, `productName: string`
    - **Customization**: You can style the gallery appearance, but the carousel functionality must remain intact

3. **BundleInfoSection**: Displays bundle name, description, and bundle form
    - **Required for**: Bundle detail pages
    - **Props**: `bundle: Bundle`, `groups: BundleGroup[]`
    - **Customization**: You can style the container and typography, but the component logic must remain intact

4. **AddToCartButton**: Handles adding products or bundles to the cart
    - **Required for**: Any page with add-to-cart functionality
    - **Props**: `payload: ConfigureItemPayload`
    - **Customization**: You can style the button appearance and provide custom children, but the cart logic must remain
      intact
