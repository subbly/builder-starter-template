import type { BundleSelectionProgress, RulesetPriceBreakdown } from '@subbly/react'
import { useFormatAmount } from '@/hooks/use-format-amount'

type SelectionProgressProps = {
  priceBreakdown: RulesetPriceBreakdown
  progress: BundleSelectionProgress
}

export const SelectionProgress = (props: SelectionProgressProps) => {
  const { formatAmount } = useFormatAmount()

  const trackWidth = props.progress.max ? `${Math.floor(props.progress.current * 100 / props.progress.max)}%` : 0

  const makeCta = (breakdown: RulesetPriceBreakdown): string => {
    switch (true) {
      case breakdown.priceType === 'per_item' && !!breakdown.price:
        return `${formatAmount(breakdown.price)} per item`
      case breakdown.priceType === 'total' && !!breakdown.price:
        return `${formatAmount(breakdown.price)} per bundle`
      case breakdown.discountType === 'per_item' && !!breakdown.amountOff:
        return `get ${formatAmount(breakdown.amountOff)} off per item `
      case breakdown.discountType === 'total' && !!breakdown.amountOff:
        return `get ${formatAmount(breakdown.amountOff)} off`
      case breakdown.discountType === 'percentage' && !!breakdown.percentOff:
        return `get ${breakdown.percentOff} off`
      default:
        return ''
    }
  }

  const ctaText = makeCta(props.priceBreakdown)

  return (
    <div className="mt-4">
      <div className="relative mb-2 h-2 w-full bg-gray-200 rounded-xl overflow-hidden">
        <div
          className="absolute left-0 top-0 h-2 bg-black rounded-xl transition-all"
          style={{
            width: trackWidth
          }}
        />
      </div>

      <div className="text-sm">
        Add {props.progress.nextIn} more items {ctaText}
      </div>
    </div>
  )
}