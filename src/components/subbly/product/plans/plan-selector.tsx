import { ProductPlan } from '@/lib/subbly/types'
import { OptionCard } from './option-card'
import { formatAmount } from '@/lib/subbly/format-amount'

export type PlanSelectorProps = {
  options: ProductPlan[]
  value: number
  onSelect: (optionId: number) => void
}

export const PlanSelector = (props: PlanSelectorProps) => {
  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="text-xl leading-[1.3] tracking-[-0.1px]">Select plan</div>

      {props.options.length === 0 ? null : (
        <div className="flex flex-col gap-2">
          {props.options.map((option) => (
            <OptionCard
              key={option.id}
              title={option.name || option.billingCycleName}
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
