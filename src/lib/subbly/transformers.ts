import {
  Product,
  ProductVariant,
  ProductPlan,
  Attribute,
  Option,
  PriceSchema,
  PriceRange,
  ProductImage,
  ProductOption,
  ProductCombination,
  Bundle,
  BundlePlan,
  BundleItem,
  BundleGroup,
  Survey,
  SurveyQuestion,
  SurveyQuestionType,
  SurveyAnswerSelect,
  SurveyAnswerMultiple,
  SurveyAnswerQuantity,
} from '@/lib/subbly/types'
import {
  ParentProduct as BaseProduct,
  ProductVariant as BaseProductVariant,
  ProductPricing,
  ProductAttribute,
  ProductVariantOption,
  ProductPriceScheme,
  PriceSchemeRange,
  ProductImage as BaseProductImage,
  ProductShipping,
  ProductOption as BaseProductOption,
  Bundle as BaseBundle,
  BundlePlan as BaseBundlePlan,
  BundleItem as BaseBundleItem,
  BundleGroup as BaseBundleGroup,
  Survey as BaseSurvey,
  SurveyQuestion as BaseSurveyQuestion,
  SurveyQuestionType as BaseSurveyQuestionType,
  SurveyQuestionText as BaseSurveyQuestionText,
  SurveyQuestionSelect as BaseSurveyQuestionSelect,
  SurveyQuestionMultiple as BaseSurveyQuestionMultiple,
  SurveyQuestionQuantity as BaseSurveyQuestionQuantity,
  SurveyAnswerSelect as BaseSurveyAnswerSelect,
  SurveyAnswerMultiple as BaseSurveyAnswerMultiple,
  SurveyAnswerQuantity as BaseSurveyAnswerQuantity,
} from '@subbly/api-client'

export const productTransformer = (
  product: BaseProduct,
  selectedVariants?: BaseProductVariant[]
): Product => {
  const priceFrom = calculatePriceFrom(product)
  const preOrderEndAt = determinePreOrderEndAt(product)
  let variants: ProductVariant[] = []

  if (selectedVariants && selectedVariants.length > 0) {
    variants = selectedVariants.map((variant) => variantTransformer(variant))
  } else {
    variants = getProductVariants(product)
  }

  return {
    id: product.id,
    type: product.type,
    name: product.name,
    slug: product.slug,
    description: product.description,
    priceFrom: priceFrom,
    images: product.images.map(imageTransformer),
    variants,
    plans: getProductPlans(product),
    options: getProductOptions(product),
    giftingEnabled: product.giftingEnabled,
    digital: product.digital,
    giftCard: isGiftCard(product),
    setupFee: getSetupFee(product),
    preOrderEndAt,
    combinations: generateCombinations(product, variants),
  }
}

export const attributeTransformer = (attribute: ProductAttribute): Attribute => {
  return {
    id: attribute.id,
    name: attribute.name,
    value: attribute.value,
  }
}

export const optionTransformer = (option: ProductVariantOption): Option => {
  return {
    id: option.id,
    name: option.name,
    value: option.value,
  }
}

export const priceRangeTransformer = (range: PriceSchemeRange): PriceRange => {
  return {
    range: range.range,
    amount: range.amount,
  }
}

export const priceSchemaTransformer = (schema: ProductPriceScheme): PriceSchema => {
  return {
    id: schema.id,
    type: schema.type as 'flat_price' | 'volume_price',
    amount: schema.ranges[0]?.amount || 0,
    ranges: schema.ranges.map(priceRangeTransformer),
  }
}

export const imageTransformer = (image: BaseProductImage): ProductImage => {
  return {
    id: image.id,
    url: image.url,
    order: image.order,
  }
}

export const productOptionTransformer = (option: BaseProductOption): ProductOption => {
  return {
    id: option.id,
    name: option.name,
    values: option.values,
  }
}

export const variantOrPlanTransformer = (
  variant: BaseProductVariant | ProductPricing
): ProductVariant | ProductPlan => {
  if ((variant as ProductPricing).parent.type === 'subscription') {
    return planTransformer(variant as ProductPricing)
  }

  return variantTransformer(variant as BaseProductVariant)
}

export const variantTransformer = (variant: BaseProductVariant): ProductVariant => {
  return {
    id: variant.id,
    type: 'variant',
    name: variant.name,
    description: variant.description,
    price: variant.price,
    priceSchema: priceSchemaTransformer(variant.priceScheme!),
    stockCount: variant.stockCount,
    attributes: variant.attributes?.map(attributeTransformer),
    options: variant.options.map(optionTransformer),
    buyLink: `https://www.subbly.co/checkout/buy/${variant.id}`,
  }
}

const surveyAnswerSelectTransformer = (answer: BaseSurveyAnswerSelect): SurveyAnswerSelect => ({
  id: answer.id,
  content: answer.content,
  description: answer.description,
  imageUrl: answer.imageUrl,
  price: answer.price,
  stockCount: answer.stockCount,
  default: answer.default,
  position: answer.position,
})

const surveyAnswerMultipleTransformer = (
  answer: BaseSurveyAnswerMultiple
): SurveyAnswerMultiple => ({
  id: answer.id,
  content: answer.content,
  description: answer.description,
  imageUrl: answer.imageUrl,
  price: answer.price,
  stockCount: answer.stockCount,
  default: answer.default,
  position: answer.position,
})

const surveyAnswerQuantityTransformer = (
  answer: BaseSurveyAnswerQuantity
): SurveyAnswerQuantity => ({
  id: answer.id,
  content: answer.content,
  description: answer.description,
  imageUrl: answer.imageUrl,
  price: answer.price,
  stockCount: answer.stockCount,
  defaultQuantity: answer.defaultQuantity,
  position: answer.position,
})

const surveyQuestionTextTransformer = (question: BaseSurveyQuestionText): SurveyQuestion => ({
  id: question.id,
  title: question.title,
  description: question.description,
  required: question.required,
  position: question.position,
  type: SurveyQuestionType.text,
})

const surveyQuestionSelectTransformer = (question: BaseSurveyQuestionSelect): SurveyQuestion => ({
  id: question.id,
  title: question.title,
  description: question.description,
  required: question.required,
  position: question.position,
  type: SurveyQuestionType.select,
  answers: question.answers.map(surveyAnswerSelectTransformer),
})

const surveyQuestionMultipleTransformer = (
  question: BaseSurveyQuestionMultiple
): SurveyQuestion => ({
  id: question.id,
  title: question.title,
  description: question.description,
  required: question.required,
  position: question.position,
  type: SurveyQuestionType.multiple,
  answers: question.answers.map(surveyAnswerMultipleTransformer),
  limits: {
    count: {
      min: question.minCount,
      max: question.maxCount,
    },
    amount: {
      min: question.minAmount,
      max: question.maxAmount,
    },
  },
})

const surveyQuestionQuantityTransformer = (
  question: BaseSurveyQuestionQuantity
): SurveyQuestion => ({
  id: question.id,
  title: question.title,
  description: question.description,
  required: question.required,
  position: question.position,
  type: SurveyQuestionType.quantity,
  answers: question.answers.map(surveyAnswerQuantityTransformer),
  limits: {
    count: {
      min: question.minCount,
      max: question.maxCount,
    },
    amount: {
      min: question.minAmount,
      max: question.maxAmount,
    },
  },
})

const surveyQuestionTransformer = (question: BaseSurveyQuestion): SurveyQuestion | null => {
  switch (question.type) {
    case BaseSurveyQuestionType.text:
      return surveyQuestionTextTransformer(question as BaseSurveyQuestionText)
    case BaseSurveyQuestionType.select:
      return surveyQuestionSelectTransformer(question as BaseSurveyQuestionSelect)
    case BaseSurveyQuestionType.multiple:
      return surveyQuestionMultipleTransformer(question as BaseSurveyQuestionMultiple)
    case BaseSurveyQuestionType.quantity:
      return surveyQuestionQuantityTransformer(question as BaseSurveyQuestionQuantity)
    default:
      return null
  }
}

export const surveyTransformer = (survey: BaseSurvey | null): Survey | null => {
  if (!survey) return null

  const supportedQuestions = survey.questions
    .map(surveyQuestionTransformer)
    .filter((q): q is SurveyQuestion => q !== null)

  if (supportedQuestions.length === 0) return null

  return {
    id: survey.id,
    title: survey.title,
    questions: supportedQuestions,
  }
}

export const planTransformer = (pricing: ProductPricing): ProductPlan => {
  return {
    id: pricing.id,
    type: 'plan',
    name: pricing.pricingName,
    description: pricing.description,
    price: pricing.price,
    priceSchema: priceSchemaTransformer(pricing.priceScheme!),
    buyLink: `https://www.subbly.co/checkout/buy/${pricing.id}`,
    attributes: [],
    billingInterval: {
      count: pricing.frequencyCount,
      unit: pricing.frequencyUnit,
    },
    trial: {
      length: pricing.trialLength,
      price: pricing.trialPrice ? pricing.trialPrice : null,
    },
    shippings: pricing.shippings.map((shipping) => ({
      buffer: {
        unit: shipping.addUnit,
        count: shipping.addCount,
      },
      unit: {
        day: 1,
        offset: 0,
      },
    })),
    billingCycleName: getBillingCycleName(pricing.frequencyCount, pricing.frequencyUnit),
    shippingCycleName: getShippingCycleName(
      pricing.shippings,
      pricing.frequencyCount,
      pricing.frequencyUnit
    ),
    limitCharges: pricing.chargesLimit,
    stockCount: pricing.stockCount,
    survey: surveyTransformer(pricing.survey),
  }
}

const isDateInPast = (dateString: string | null): boolean => {
  if (!dateString) return false
  return new Date(dateString) < new Date()
}

const getBillingCycleName = (frequencyCount: number, frequencyUnit: string): string => {
  const unit = frequencyUnit.charAt(0).toUpperCase() + frequencyUnit.slice(1)

  if (frequencyCount === 1) {
    return `Every ${unit}`
  }

  const pluralUnit = `${unit}${frequencyCount > 1 ? 's' : ''}`

  return `Every ${frequencyCount} ${pluralUnit}`
}

const getShippingCycleName = (
  shippings: ProductShipping[],
  frequencyCount: number,
  frequencyUnit: string
): string | null => {
  const shippingsCount = shippings.length

  if (shippingsCount === 0) {
    return null
  }

  const over = shippingsCount > 1 ? ' over ' : ' '
  const shipmentText = shippingsCount === 1 ? 'shipment' : 'shipments'
  const billingCycle = `${frequencyCount} ${frequencyUnit}(s)`.toLowerCase()

  return `${shippingsCount} ${shipmentText}${over}${billingCycle}`
}

const calculatePriceFrom = (product: BaseProduct): number => {
  if (product.type === 'one_time') {
    return Math.min(...(product.variants?.map((variant) => variant.price) || [0]))
  }
  return Math.min(...(product.pricings?.map((pricing) => pricing.price) || [0]))
}

const determinePreOrderEndAt = (product: BaseProduct): Date | null => {
  if (
    product.type === 'subscription' &&
    product.preOrderEndAt &&
    !isDateInPast(product.preOrderEndAt)
  ) {
    return new Date(product.preOrderEndAt)
  }
  return null
}

const getProductVariants = (product: BaseProduct): ProductVariant[] => {
  if (product.type === 'one_time' && product.variants) {
    return product.variants.map((v) => variantTransformer(v))
  }
  return []
}

const getProductPlans = (product: BaseProduct): ProductPlan[] => {
  if (product.type === 'subscription' && product.pricings) {
    return product.pricings.map(planTransformer)
  }
  return []
}

const getProductOptions = (product: BaseProduct): ProductOption[] => {
  if (product.type === 'one_time' && product.options) {
    return product.options.map(productOptionTransformer)
  }
  return []
}

const isGiftCard = (product: BaseProduct): boolean => {
  return product.type === 'one_time' ? product.giftCard : false
}

const getSetupFee = (product: BaseProduct): number | null => {
  return product.type === 'subscription' ? product.setupFee : null
}

const generateCombinations = (
  product: BaseProduct,
  variants: ProductVariant[]
): ProductCombination[] | undefined => {
  if (product.type !== 'one_time' || variants.length === 0) {
    return undefined
  }

  return variants.map((variant) => ({
    id: variant.id,
    inStock: variant.stockCount === null || variant.stockCount > 0,
    price: variant.price,
    ...variant.options.reduce(
      (accumulator, option) => ({ ...accumulator, [option.name.toLowerCase()]: option.value }),
      {}
    ),
  }))
}

export const bundlePlanTransformer = (bundlePlan: BaseBundlePlan): BundlePlan => {
  const isPricing = bundlePlan.pricing !== null

  return {
    id: bundlePlan.id,
    type: isPricing ? 'subscription' : 'one_time',
    plan: isPricing
      ? planTransformer(bundlePlan.pricing!)
      : variantTransformer(bundlePlan.variant!),
    prices: bundlePlan.prices || [],
    discounts: bundlePlan.discounts || [],
  }
}

export const bundleTransformer = (bundle: BaseBundle): Bundle => {
  const priceFrom = calculateBundlePriceFrom(bundle)

  return {
    id: bundle.id,
    name: bundle.name,
    slug: bundle.slug,
    description: bundle.description,
    priceFrom: priceFrom,
    images: bundle.images.map(imageTransformer),
    plans: bundle.plans.map(bundlePlanTransformer),
    digital: bundle.digital,
    configurable: bundle.configurable,
    selectionType: bundle.selectionType,
    discountType: bundle.discountType,
    priceType: bundle.priceType,
  }
}

export const bundleItemTransformer = (item: BaseBundleItem): BundleItem => {
  return {
    id: item.id,
    varianId: item.productId,
    variant: variantTransformer(item.product),
    quantity: item.quantity,
    extraPrice: item.extraPrice,
    stockCount: item.stockCount,
  }
}

export const bundleGroupTransformer = (group: BaseBundleGroup): BundleGroup => {
  return {
    id: group.id,
    items: group.items.map(bundleItemTransformer),
    maxQuantity: group.maxQuantity,
    minQuantity: group.minQuantity,
    productId: group.productId,
    product: productTransformer(
      group.product,
      group.items.map((item) => item.product)
    ),
  }
}

const calculateBundlePriceFrom = (bundle: BaseBundle): number => {
  if (!bundle.plans || bundle.plans.length === 0) {
    return 0
  }

  return (
    Math.min(
      ...bundle.plans.map((plan) => {
        if (!plan.prices || plan.prices.length === 0) {
          return 0
        }

        return Math.min(
          ...plan.prices.map((price) => {
            if (!price.ranges || price.ranges.length === 0) {
              return 0
            }

            return Math.min(...price.ranges.map((range) => range.amount || 0))
          })
        )
      })
    ) || 0
  )
}
