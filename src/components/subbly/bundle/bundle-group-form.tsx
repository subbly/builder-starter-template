'use client'

import { BundleGroupSelect } from './bundle-group-select'
import {
  Bundle,
  BundleGroup,
  CartItemAddPayloadBundle,
  ProductPlan,
  ProductVariant,
} from '@/lib/subbly/types'
import { useMemo, useState } from 'react'

import { useBundlePrice } from '@/hooks/subbly/use-bundle-price'
import { PlanSelector } from './plan-selector'
import { Button } from '@/components/ui/button'
import { useSubblyCart } from '@/lib/subbly/use-subbly-cart'
import { BundleForm, SelectedBundleItem } from '@/types'

export type BundleGroupFormProps = {
  bundle: Bundle
  groups: BundleGroup[]
}

type GroupsFormItemsRecord = Record<BundleGroup['id'], SelectedBundleItem>

const makeBundleGroupsForm = ({
  bundle,
  groups,
}: {
  bundle: Bundle
  groups: BundleGroup[]
}): BundleForm => {
  const firstPlan = bundle.plans[0]

  return {
    productId: firstPlan.plan?.id,
    quantity: 1,
    items: groups.reduce<GroupsFormItemsRecord>((acc, group) => {
      const firstItem = group.items.find((item) => {
        return item.variant.stockCount === null || item.variant.stockCount > 0
      })

      if (!firstItem) {
        return acc
      }

      acc[group.id] = {
        item: firstItem,
        quantity: 1,
      }

      return acc
    }, {}),
  }
}

const formToCartPayload = (form: BundleForm): CartItemAddPayloadBundle => {
  const items = Object.values(form.items).map((selectedItem) => ({
    productId: selectedItem.item.varianId,
    quantity: selectedItem.quantity,
  }))

  return {
    productId: form.productId,
    quantity: form.quantity,
    bundle: {
      items,
      preferences: [],
    },
  }
}

export const BundleGroupForm = (props: BundleGroupFormProps) => {
  const { bundle, groups } = props
  const { addToCart } = useSubblyCart()

  const [groupsFrom, setGroupsForm] = useState<BundleForm>(
    makeBundleGroupsForm({
      bundle: bundle,
      groups: groups,
    })
  )

  const showGroupProduct = groups.length > 1

  const { subtotal, planPriceCalculatorMap } = useBundlePrice({
    bundle,
    form: groupsFrom,
  })

  const plans = useMemo(() => {
    return bundle.plans.reduce<(ProductVariant | ProductPlan)[]>((acc, plan) => {
      return [...acc, plan.plan]
    }, [])
  }, [bundle.plans])

  const onAddToCart = (): void => {
    const payload = formToCartPayload(groupsFrom)

    if (!payload.bundle?.items || payload.bundle.items.length < groups.length) {
      return
    }

    addToCart(payload)
  }

  const onItemSelect = (group: BundleGroup, item: SelectedBundleItem): void => {
    setGroupsForm({
      ...groupsFrom,
      items: {
        ...groupsFrom.items,
        [group.id]: item,
      },
    })
  }

  const getSelectedItem = (groupId: BundleGroup['id']): SelectedBundleItem | null => {
    return groupsFrom.items[groupId] || null
  }

  const onPricingSelect = (productId: number) => {
    setGroupsForm({
      ...groupsFrom,
      productId,
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:gap-6">
      {groups.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:gap-6">
          {groups.map((group) => (
            <BundleGroupSelect
              key={group.id}
              group={group}
              showProduct={showGroupProduct}
              selectedItem={getSelectedItem(group.id)}
              onSelectedItemChange={(item) => onItemSelect(group, item)}
            />
          ))}
        </div>
      )}

      {plans.length > 0 && (
        <PlanSelector
          subtotal={subtotal}
          options={plans}
          value={groupsFrom.productId}
          priceCalculatorMap={planPriceCalculatorMap}
          onSelect={(productId) => onPricingSelect(productId)}
        />
      )}

      <Button className="h-10 w-full" onClick={() => onAddToCart()}>
        <span className="capitalize">Add to cart</span>
      </Button>
    </div>
  )
}
