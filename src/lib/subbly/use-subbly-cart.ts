import type { ConfigureItemPayload } from "./types";

export const useSubblyCart = () => {
  const getCart = () => {
    return window.subblyCart;
  };

  /**
   * Adds an item to the Subbly cart.
   *
   * @param payload - The configuration payload for the item to add
   * Can be one of these types:
   * - For subscription products: { productId: number, quantity?: number }
   * - For one-time products: { productId: number, quantity?: number, addon?: boolean, addonDuration?: number | 0 | 1, giftCard?: GiftCardRecipient | null }
   * - For bundles: { bundleId: number, quantity?: number } or { productId: number, bundleId: number, quantity?: number }
   * - For surveys: { surveyId: number }
   */
  const addToCart = (payload: ConfigureItemPayload) => {
    getCart()?.configureItem(payload);
  };

  return {
    addToCart
  };
};