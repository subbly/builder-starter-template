import { useCallback, useMemo } from 'react'
import { ProductPlan, ProductVariant } from '@/lib/subbly/types'
import { SubscriptionOptionCard } from './subscription-option-card'
import { PlanPriceCalculatorMap } from '@/types'
import { OneTimeOptionCard } from './one-time-option-card'

export type PlanSelectorProps = {
  options: (ProductVariant | ProductPlan)[]
  value: number
  onSelect: (optionId: number) => void
  priceCalculatorMap: PlanPriceCalculatorMap
  subtotal: number
}

export const PlanSelector = (props: PlanSelectorProps) => {
  const plans = useMemo(() => {
    return props.options.reduce<{ oneTime: ProductVariant[]; subscription: ProductPlan[] }>(
      (acc, pricing) => {
        if (pricing.type === 'variant') {
          acc.oneTime.push(pricing as ProductVariant)
        } else {
          acc.subscription.push(pricing as ProductPlan)
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
    const priceFn = props.priceCalculatorMap.get(optionId)
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
              onSelect={() => props.onSelect(option.id)}
            />
          ))}

      {plans.subscription.length === 0 ? null : (
        <SubscriptionOptionCard
          options={plans.subscription}
          value={!isOneTimeSelected ? props.value : null}
          basePrice={props.subtotal}
          getOptionPrice={getOptionPrice}
          onSelect={(optionId) => props.onSelect(optionId)}
        />
      )}
    </div>
  )
}
