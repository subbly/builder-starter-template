import { OptionCard } from '../product/plans/option-card'
import type { ProductVariant } from '@subbly/react'
import { useFormatAmount } from '@/hooks/use-format-amount'

export type OneTimeOptionCardProps = {
  option: ProductVariant
  selected?: boolean
  price: number
  basePrice?: number
  hidePrice?: boolean
  onSelect: () => void
}

export const OneTimeOptionCard = (props: OneTimeOptionCardProps) => {
  const { formatAmount } = useFormatAmount()
  const originalPrice = props.basePrice && props.basePrice !== props.price ? formatAmount(props.basePrice) : undefined
  const price = !props.hidePrice && props.price > 0 ? formatAmount(props.price) : ''

  return (
    <OptionCard
      selected={props.selected || false}
      title={'One-time purchase'}
      price={price}
      originalPrice={originalPrice}
      onSelect={() => props.onSelect()}
    />
  )
}
