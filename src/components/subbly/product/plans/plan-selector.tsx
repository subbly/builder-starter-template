import { OptionCard } from './option-card'
import { useFormatAmount } from '@/hooks/use-format-amount'
import { formatBillingFrequency } from '@subbly/react'
import type { ProductPlan } from '@subbly/react'

export type PlanSelectorProps = {
  options: ProductPlan[]
  value: number | null
  onSelect: (optionId: number) => void
}

export const PlanSelector = (props: PlanSelectorProps) => {
  const { formatAmount } = useFormatAmount()

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-xl leading-[1.3] tracking-[-0.1px]">Select plan</div>

      {props.options.length === 0 ? null : (
        <div className="flex flex-col gap-2">
          {props.options.map((option) => (
            <OptionCard
              key={option.id}
              title={option.pricingName || formatBillingFrequency(option.frequencyUnit, option.frequencyCount)}
              price={formatAmount(option.price)}
              selected={props.value === option.id}
              description={
                option.description ? (
                  <div className="px-3 pb-3 text-sm text-gray-600">{option.description}</div>
                ) : undefined
              }
              onSelect={() => {
                props.onSelect(option.id)
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
