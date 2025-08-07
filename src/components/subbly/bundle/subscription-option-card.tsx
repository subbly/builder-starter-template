import { OptionCard } from '../product/plans/option-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useState } from 'react'
import { formatBillingFrequency, useCurrencyFormatter } from '@subbly/react'
import type { ProductPricing } from '@subbly/react'

export type SubscriptionOptionCardProps = {
  options: ProductPricing[]
  value: ProductPricing['id'] | null
  basePrice: number
  onSelect: (optionId: ProductPricing['id']) => void
  getOptionPrice: (optionId: ProductPricing['id']) => number
}

export const SubscriptionOptionCard = (props: SubscriptionOptionCardProps) => {
  const { formatAmount } = useCurrencyFormatter()
  const [activeOption, setActiveOption] = useState<ProductPricing | null>(props.options[0])
  const hasMultipleOptions = props.options.length > 1
  const selectedOption = props.options.find((option) => option.id === props.value)

  const price = props.getOptionPrice(activeOption!.id)
  const showBasePrice = props.basePrice > 0 && price !== props.basePrice
  const basePrice = showBasePrice ? formatAmount(props.basePrice) : null

  const isSelected = !!selectedOption

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
      price={formatAmount(price)}
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
                    {option.name || formatBillingFrequency(option.frequencyUnit, option.frequencyCount)}
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
