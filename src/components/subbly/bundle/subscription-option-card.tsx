import { OptionCard } from '../product/plans/option-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { formatBillingFrequency } from '@subbly/react'
import type { ProductPlan } from '@subbly/react'
import { useFormatAmount } from '@/hooks/use-format-amount'

export type SubscriptionOptionCardProps = {
  options: ProductPlan[]
  value: ProductPlan['id'] | null
  basePrice: number
  hidePrice?: boolean
  onSelect: (optionId: ProductPlan['id']) => void
  getOptionPrice: (optionId: ProductPlan['id']) => number
}

export const SubscriptionOptionCard = (props: SubscriptionOptionCardProps) => {
  const { formatAmount } = useFormatAmount()
  const [activeOption, setActiveOption] = useState<ProductPlan | null>(props.options[0])
  const hasMultipleOptions = props.options.length > 1
  const selectedOption = props.options.find((option) => option.id === props.value)

  const selectedOptionPrice = props.getOptionPrice(activeOption!.id)
  const showBasePrice = props.basePrice > 0 && selectedOptionPrice !== props.basePrice
  const basePrice = showBasePrice ? formatAmount(props.basePrice) : null

  const isSelected = !!selectedOption
  const price = !props.hidePrice && selectedOptionPrice > 0 ? formatAmount(selectedOptionPrice) : ''
  const onFrequencySelect = (value: string) => {
    const option = props.options.find((option) => option.id === +value) || null
    if (!option) {
      return
    }
    setActiveOption(option)
    props.onSelect(option.id)
  }
  return (
    <OptionCard
      title={'Subscribe'}
      selected={isSelected}
      price={price}
      originalPrice={basePrice}
      onSelect={() => onFrequencySelect(`${activeOption!.id}`)}
      nestedOptions={
        !hasMultipleOptions ? null : (
          <span className="p-4">
            <span className="block mb-1.5 text-xs font-bold">Select plan</span>

            <Select
              value={activeOption?.id ? `${activeOption.id}` : undefined}
              onValueChange={(value) => onFrequencySelect(value)}
            >
              <SelectTrigger className="w-full min-h-[42px] max-w-full bg-background border text-base px-4 rounded-[8px]">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>

              <SelectContent>
                {props.options.map((option) => (
                  <SelectItem key={option.id} value={`${option.id}`}>
                    {option.pricingName || formatBillingFrequency(option.frequencyUnit, option.frequencyCount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </span>
        )
      }
    />
  )
}
