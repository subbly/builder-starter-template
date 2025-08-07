export type CartItemAddPayloadOneTime = {
  productId: number
  quantity?: number
  /**
   * Add as an addon to the subscription.
   */
  addon?: boolean
  /**
   * The duration of the addon. 0 means no duration, 1 means 1 shipping.
   */
  addonDuration?: number | 0 | 1
  /**
   * Applies to one-time products that are gift cards.
   */
  giftCard?: GiftCardRecipient | null
}

export type GiftCardRecipient = {
  customerEmail: string | null
  customerName: string | null
  message: string | null
}

export type SurveyAnswer = {
  /**
   * Answer ID - required for select, multiple, quantity question types
   */
  id?: number
  /**
   * Answer content - required only for text question type
   */
  content?: string
  /**
   * Quantity - required only for quantity question type
   */
  quantity?: number
}

export type UpdateCartPayload = {
  couponCode?: string
  currencyCode?: string
  giftCardCode?: string
  giftInfo?: {
    message: string | null
    /**
     * Only for subscription/bundle plans
     */
    numberOfOrders: number | null
    recipientEmail?: string | null
    /**
     * Only for subscription/bundle plans
     */
    startsAt: string | null
  } | null
  referralId?: number | null
}

export type ProductImage = {
  id: number
  url: string
  order: number
}

export type Attribute = {
  id: number
  name: string
  value: string
}

export type Option = {
  id: number
  name: string
  value: string
}

export type PriceRange = {
  range: number
  amount: number
}

export type PriceSchema = {
  id: number
  type: 'flat_price' | 'volume_price'
  amount: number
  ranges: PriceRange[]
}

export enum SurveyQuestionType {
  text = 'text',
  select = 'select',
  multiple = 'multiple',
  quantity = 'quantity',
}

export type SurveyQuestionBase = {
  id: number
  title: string
  description: string | null
  required: boolean
  position: number
}

export type SurveyAnswerSelect = {
  id: number
  content: string | null
  description: string | null
  imageUrl: string | null
  price: number
  stockCount: number | null
  default: boolean
  position: number
}

export type SurveyAnswerMultiple = {
  id: number
  content: string | null
  description: string | null
  imageUrl: string | null
  price: number
  stockCount: number | null
  default: boolean
  position: number
}

export type SurveyAnswerQuantity = {
  id: number
  content: string | null
  description: string | null
  imageUrl: string | null
  price: number
  stockCount: number | null
  defaultQuantity: number
  position: number
}

export type SurveyCountLimits = {
  min: number | null
  max: number | null
}

export type SurveyAmountLimits = {
  min: number | null
  max: number | null
}

export type SurveyLimits = {
  count: SurveyCountLimits
  amount: SurveyAmountLimits
}

export type SurveyQuestionText = SurveyQuestionBase & {
  type: SurveyQuestionType.text
}

export type SurveyQuestionSelect = SurveyQuestionBase & {
  type: SurveyQuestionType.select
  answers: SurveyAnswerSelect[]
}

export type SurveyQuestionMultiple = SurveyQuestionBase & {
  type: SurveyQuestionType.multiple
  answers: SurveyAnswerMultiple[]
  limits: SurveyLimits
}

export type SurveyQuestionQuantity = SurveyQuestionBase & {
  type: SurveyQuestionType.quantity
  answers: SurveyAnswerQuantity[]
  limits: SurveyLimits
}

export type SurveyQuestion =
  | SurveyQuestionText
  | SurveyQuestionSelect
  | SurveyQuestionMultiple
  | SurveyQuestionQuantity

export type Survey = {
  id: number
  title: string
  questions: SurveyQuestion[]
}

export type ProductPlan = {
  id: number
  type: 'plan'
  name: string | null
  description: string | null
  billingInterval: { count: number; unit: 'day' | 'week' | 'month' }
  trial: {
    length: number | null
    price: number | null
  }
  price: number
  priceSchema: PriceSchema
  stockCount: number | null
  attributes: Attribute[]
  buyLink: string
  shippings: {
    /**
     * How much day from a purchase will take to send each shipping
     */
    buffer: {
      /**
       * Unit of time to wait till the shipping is sent.
       */
      unit: 'day' | 'week' | 'month' | null
      /**
       * How many units of time wait till the shipping is sent.
       */
      count: number | null
    }
    /**
     * On which day of billing interval the shipping will be sent.
     */
    unit: {
      /**
       * Day of a week/month
       */
      day: number | null
      /**
       * Number of the billing cycle month/week. Starting from 0.
       */
      offset: number | null
    }
  }[]
  billingCycleName: string
  shippingCycleName: string | null
  /**
   * The number of times the plan will be charged during subscription lifecycle.
   * After this number of charges, the subscription will be expired.
   */
  limitCharges: number | null
  survey: Survey | null
}

export type ProductVariant = {
  id: number
  type: 'variant'
  name: string
  description: string | null
  price: number
  priceSchema: PriceSchema
  stockCount: number | null
  attributes: Attribute[]
  options: Option[]
  buyLink: string
}

export type ProductCombination = {
  id: number
  inStock: boolean
  price: number
  [key: string]: string | boolean | number
}

export type ProductType = 'one_time' | 'subscription'

export type Product = {
  id: number
  type: ProductType
  name: string
  slug: string
  description: string | null
  priceFrom: number
  images: ProductImage[]
  /**
   * Only one-time product can have variants.
   */
  variants: ProductVariant[]
  /**
   * Only subscription product can have plans.
   */
  plans: ProductPlan[]
  /**
   * Product options available for selection.
   * Only one-time products have options.
   */
  options: ProductOption[]
  /**
   * Determines if the product can be purchased as a gift.
   */
  giftingEnabled: boolean
  digital: boolean
  /**
   * The product is a gift card.
   * This is used to determine if the product is a gift card or not.
   * Only one product can be a gift card.
   */
  giftCard: boolean
  /**
   * The setup fee is applicable only for subscription products.
   */
  setupFee: number | null
  /**
   * Pre-order end date is applicable only for subscription products. Customer won't be charged until that date.
   */
  preOrderEndAt: Date | null
  /**
   * Array of option combinations with their availability and price information
   * Only applicable for one-time products with variants
   */
  combinations?: ProductCombination[]
}

export type ProductOption = {
  id: number
  name: string
  values: string[]
}

/**
 * Variant means select from a list of product variants
 * Product means that list is grouped by product and you can select multiple product variants from the same bundle group
 * Single product means that list is groped by a product and you can select only one product variant from the bundle group
 */
export type BundleSelectionType = 'variant' | 'product' | 'single_product'

/**
 * Null means no discount
 */
export type BundleDiscountType = 'per_item' | 'total' | 'percentage' | null

/**
 * Null means price is calculated by the sum of bundle items
 */
export type BundlePriceType = 'per_item' | 'total' | null

