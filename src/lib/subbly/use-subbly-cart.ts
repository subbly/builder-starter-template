import type { ConfigureItemPayload, UpdateCartPayload } from './types'

export const useSubblyCart = () => {
  const getCart = () => {
    return window.subblyCart
  }

  /**
   * Adds an item to the Subbly cart.
   *
   * @param payload - The configuration payload for the item to add
   * Can be one of these types:
   * - For subscription products: { productId: number, quantity?: number, options?: SurveyOption[] }
   * - For one-time products: { productId: number, quantity?: number, addon?: boolean, addonDuration?: number | 0 | 1, giftCard?: GiftCardRecipient | null }
   * - For bundles: { productId: number, quantity?: number, bundle?: { items: BundlePayloadItem[], preferences: [] }, options?: SurveyOption[] }
   * - For bundle configuration: { bundleId: number, productId?: number, quantity?: number, options?: SurveyOption[] }
   * - For surveys: { surveyId: number }
   * @returns Promise that resolves when the item is added to the cart
   */
  const addToCart = async (payload: ConfigureItemPayload) => {
    return await getCart()?.configureItem(payload)
  }

  /**
   * Updates the cart with new information.
   *
   * @param payload - The update payload for the cart
   * Can include:
   * - couponCode: Apply a coupon code to the cart
   * - currencyCode: Change the cart currency
   * - giftCardCode: Apply a gift card code
   * - giftInfo: Set gift information (startsAt and numberOfOrders only for subscription/bundle plans)
   * - referralId: Set a referral ID
   * @returns Promise that resolves when the cart is updated
   */
  const updateCart = async (payload: UpdateCartPayload) => {
    return await getCart()?.updateCart(payload)
  }

  return {
    addToCart,
    updateCart,
  }
}
