import { OptionCard } from '../product/plans/option-card'
import type { ProductVariant } from '@subbly/react'
import { useFormatAmount } from '@/hooks/use-format-amount'

export type OneTimeOptionCardProps = {
  option: ProductVariant
  selected?: boolean
  price: number
  basePrice?: number
  onSelect: () => void
}

export const OneTimeOptionCard = (props: OneTimeOptionCardProps) => {
  const { formatAmount } = useFormatAmount()

  return (
    <OptionCard
      selected={props.selected || false}
      title={'One-time purchase'}
      price={formatAmount(props.price)}
      originalPrice={props.basePrice ? formatAmount(props.basePrice) : undefined}
      onSelect={() => props.onSelect()}
    />
  )
}
