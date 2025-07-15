'use client'

import { Product, ProductPlan, ProductVariant } from '@/lib/subbly/types'
import { useMemo, useState } from 'react'

import { PlanSelector } from './plans/plan-selector'
import { VariantSelector } from './variant/variant-selector'
import { QuantitySelector } from './quantity/quantity-selector'
import { formatAmount } from '@/lib/subbly/format-amount'
import { AddToCartButton } from '../add-to-cart-button'
import { ProductForm as ProductFormType } from '@/types'

export type ProductGroupFormProps = {
  product: Product
}

const makeProductForm = ({ product }: { product: Product }): ProductFormType => {
  if (product.type === 'subscription') {
    const plan = product.plans.find((plan) => plan.stockCount === null || plan.stockCount > 0)

    return {
      productId: plan?.id || 0,
      quantity: 1,
    }
  }

  const variant = product.variants.find(
    (variant) => variant.stockCount === null || variant.stockCount > 0
  )

  return {
    productId: variant?.id || 0,
    quantity: 1,
  }
}

export const ProductForm = (props: ProductGroupFormProps) => {
  const product = props.product

  const [productForm, setProductForm] = useState<ProductFormType>(makeProductForm({ product }))

  const selectedItem = useMemo((): ProductVariant | ProductPlan => {
    if (product.type === 'one_time') {
      return product.variants.find(
        (variant) => variant.id === productForm.productId
      ) as ProductVariant
    }

    return product.plans.find((plan) => plan.id === productForm.productId) as ProductPlan
  }, [product, productForm.productId])

  const defaultState = useMemo((): Record<string, string> | undefined => {
    if (product.type !== 'one_time' || !selectedItem) {
      return undefined
    }

    return (selectedItem as ProductVariant).options?.reduce(
      (acc, option) => ({
        ...acc,
        [option.name.toLowerCase()]: option.value,
      }),
      {}
    )
  }, [selectedItem, product.type])

  const onPricingSelect = (productId: number) => {
    setProductForm({
      ...productForm,
      productId,
    })
  }

  const onVariantSelect = (variantId: number) => {
    setProductForm({
      ...productForm,
      productId: variantId,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:gap-6">
      {product.type === 'one_time' && !selectedItem ? (
        <div>From {formatAmount(product.priceFrom)}</div>
      ) : product.type === 'one_time' && selectedItem ? (
        <div>{formatAmount(selectedItem.price * productForm.quantity)}</div>
      ) : null}

      {product.plans.length > 0 && (
        <PlanSelector
          options={product.plans}
          value={productForm.productId}
          onSelect={(productId) => onPricingSelect(productId)}
        />
      )}

      {product.variants.length > 0 && (
        <VariantSelector
          options={product.options}
          combinations={product.combinations}
          state={defaultState}
          onSelect={(combination) => onVariantSelect(combination.id)}
        />
      )}

      {product.type === 'one_time' && (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 text-sm font-medium">Quantity:</div>
          <QuantitySelector
            value={productForm.quantity}
            onChange={(quantity) => {
              setProductForm({
                ...productForm,
                quantity,
              })
            }}
          />
        </div>
      )}

      <AddToCartButton payload={productForm}>
        <span className="capitalize">Add to cart</span>
      </AddToCartButton>
    </div>
  )
}
