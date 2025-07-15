import { ProductVariant } from '@/lib/subbly/types'
import { OptionCard } from '../product/plans/option-card'
import { formatAmount } from '@/lib/subbly/format-amount'

export type OneTimeOptionCardProps = {
  option: ProductVariant
  selected?: boolean
  price: number
  basePrice?: number
  onSelect: () => void
}

export const OneTimeOptionCard = (props: OneTimeOptionCardProps) => {
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
