'use client'

import {
  ProductPlan,
  useCurrencyFormatter,
  useProductForm,
  useVariantCombinations
} from '@subbly/react'
import type { ParentProduct, ProductVariant } from '@subbly/react'
import { useMemo } from 'react'
import { PlanSelector } from './plans/plan-selector'
import { VariantSelector } from './variant/variant-selector'
import { QuantitySelector } from './quantity/quantity-selector'
import { Button } from '@/components/ui/button'

export type ProductGroupFormProps = {
  product: ParentProduct
}

export const ProductForm = (props: ProductGroupFormProps) => {
  const product = props.product

  const { formatAmount } = useCurrencyFormatter()

  let variants: ProductVariant[] = []

  if (product.type === 'one_time') {
    variants = product.variants
  }

  const variantCombinations = useVariantCombinations({
    variants
  })

  const { productForm, plans, selectedProduct, priceFrom, setProductForm, selectProduct, addToCart } = useProductForm({
    product
  })

  const defaultState = useMemo((): Record<string, string> | undefined => {
    if (product.type !== 'one_time' || !selectedProduct) {
      return undefined
    }

    return (selectedProduct as ProductVariant).options?.reduce(
      (acc, option) => ({
        ...acc,
        [option.name.toLowerCase()]: option.value
      }),
      {}
    )
  }, [selectedProduct, product.type])

  const onAddToCart = () => {
    addToCart()
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:gap-6">
      {product.type === 'one_time' && !selectedProduct ? (
        <div>From {formatAmount(priceFrom)}</div>
      ) : product.type === 'one_time' && selectedProduct ? (
        <div>{formatAmount(selectedProduct.price * productForm.quantity)}</div>
      ) : null}

      {plans.length > 0 && (
        <>
          {product.type === 'one_time' ? (
            <VariantSelector
              options={product.options}
              combinations={variantCombinations}
              state={defaultState}
              onSelect={(combination) => selectProduct(combination.id)}
            />
          ) : (
            <PlanSelector
              options={plans as ProductPlan[]}
              value={productForm.productId}
              onSelect={(productId) => selectProduct(productId)}
            />
          )}
        </>
      )}

      {product.type === 'one_time' && (
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0 text-sm font-medium">Quantity:</div>
          <QuantitySelector
            value={productForm.quantity}
            onChange={(quantity) => {
              setProductForm({
                ...productForm,
                quantity
              })
            }}
          />
        </div>
      )}

      <Button className="h-10 w-full" onClick={() => onAddToCart()}>
        <span className="capitalize">Add to cart</span>
      </Button>
    </div>
  )
}
