import { useCallback, useMemo } from 'react'
import { SubscriptionOptionCard } from './subscription-option-card'
import { OneTimeOptionCard } from './one-time-option-card'
import type { Product, ProductPlan, ProductVariant, PlanPriceCalculatorMap } from '@subbly/react'

export type PlanSelectorProps = {
  options: Product[]
  value: number
  onSelect: (optionId: number) => void
  priceCalculatorMap?: PlanPriceCalculatorMap
  subtotal: number
  hidePlanPrice?: boolean
  hideBasePrice?: boolean
}

export const PlanSelector = (props: PlanSelectorProps) => {
  const plans = useMemo(() => {
    return props.options.reduce<{ oneTime: ProductVariant[]; subscription: ProductPlan[] }>(
      (acc, plan) => {
        if (!!(plan as ProductPlan).frequencyCount) {
          acc.subscription.push(plan as ProductPlan)
        } else {
          acc.oneTime.push(plan as unknown as ProductVariant)
        }

        return acc
      },
      { oneTime: [], subscription: [] }
    )
  }, [props.options])

  const isOptionSelected = useCallback(
    (optionId: number) => {
      return props.value === optionId
    },
    [props.value]
  )

  const isOneTimeSelected = useMemo(() => {
    return plans.oneTime.some((option) => isOptionSelected(option.id))
  }, [plans.oneTime, isOptionSelected])

  const getOptionPrice = (optionId: number): number => {
    const priceFn = props.priceCalculatorMap?.get(optionId)
    return priceFn ? priceFn(props.subtotal) : props.subtotal
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-xl leading-[1.3] tracking-[-0.1px]">Select plan</div>

      {plans.oneTime.length === 0
        ? null
        : plans.oneTime.map((option) => (
            <OneTimeOptionCard
              key={option.id}
              option={option}
              selected={isOptionSelected(option.id)}
              price={getOptionPrice(option.id)}
              basePrice={props.subtotal}
              hidePrice={props.hidePlanPrice}
              hideBasePrice={props.hideBasePrice}
              onSelect={() => props.onSelect(option.id)}
            />
          ))}

      {plans.subscription.length === 0 ? null : (
        <SubscriptionOptionCard
          options={plans.subscription}
          value={!isOneTimeSelected ? props.value : null}
          basePrice={props.subtotal}
          getOptionPrice={getOptionPrice}
          hidePrice={props.hidePlanPrice}
          hideBasePrice={props.hideBasePrice}
          onSelect={(optionId) => props.onSelect(optionId)}
        />
      )}
    </div>
  )
}
