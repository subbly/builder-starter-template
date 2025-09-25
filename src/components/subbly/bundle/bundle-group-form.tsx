'use client'

import { BundleGroupSelect } from './bundle-group-select'

import { PlanSelector } from './plan-selector'
import { Button } from '@/components/ui/button'
import { useBundleGroupForm } from '@subbly/react'
import type { Bundle, BundleGroup } from '@subbly/react'

export type BundleGroupFormProps = {
  bundle: Bundle
  groups: BundleGroup[]
}

export const BundleGroupForm = (props: BundleGroupFormProps) => {
  const {
    form,
    showGroupProduct,
    subtotal,
    plans,
    planPriceCalculatorMap,
    addToCart,
    selectItem,
    selectPlan,
    getSelectedItem
  } = useBundleGroupForm({
    bundle: props.bundle,
    groups: props.groups
  })

  const onAddToCart = () => {
    addToCart()
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:gap-6">
      {props.groups.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {props.groups.map((group) => (
            <BundleGroupSelect
              key={group.id}
              group={group}
              showProduct={showGroupProduct}
              selectedItem={getSelectedItem(group.id)}
              onSelectedItemChange={(item) => selectItem(group, item)}
            />
          ))}
        </div>
      )}

      {plans.length > 0 && (
        <PlanSelector
          subtotal={subtotal}
          options={plans}
          value={form.productId}
          priceCalculatorMap={planPriceCalculatorMap}
          onSelect={(productId) => selectPlan(productId)}
        />
      )}

      <Button className="h-10 w-full" onClick={() => onAddToCart()}>
        <span className="capitalize">Add to cart</span>
      </Button>
    </div>
  )
}
