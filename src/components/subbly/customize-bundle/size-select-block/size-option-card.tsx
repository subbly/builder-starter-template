import type { BundleRuleset } from '@subbly/react'
import { useCallback } from 'react'
import { useFormatAmount } from '@/hooks/use-format-amount'
import { Button } from '@/components/ui/button'

type BundleSizeOptionProps = {
  ruleset: BundleRuleset
  cta?: string
  selected?: boolean
  showSizeName?: boolean
  onSelect: () => void
}

const getQuantityTitle = (min: number, max: number | null): string => {
  switch (true) {
    case min === max:
      return `${min}`

    case max === null:
      return `${min}+`

    default:
      return `${min}-${max}`
  }
}

export const SizeOptionCard = (props: BundleSizeOptionProps) => {
  const ruleset = props.ruleset
  const { formatAmount } = useFormatAmount()

  const getPriceTitle = useCallback((min: number, max: number | null): string => {
    switch (true) {
      case min === 0 && !!max:
        return `${formatAmount(max)}`

      case max === null:
        return `${formatAmount(min)}+`

      default:
        return `${formatAmount(min)}-${formatAmount(max)}`
    }
  }, [formatAmount])

  const getFormattedTitle = useCallback(() => {
    if (props.showSizeName) {
      return ruleset.name
    }

    const isPriceBased = !!(ruleset.minTotal || ruleset.maxTotal)

    if (isPriceBased) {
      const text = ruleset.minTotal === 0 ? 'Items worth up to' : 'Items worth'
      return `${text} ${getPriceTitle(ruleset.minTotal, ruleset.maxTotal)}`
    }

    return `${getQuantityTitle(ruleset.minQuantity, ruleset.maxQuantity)} ${ruleset.minQuantity === 1 && !ruleset.maxQuantity ? 'item' : 'items'}`
  }, [ruleset, props.showSizeName, getPriceTitle])

  const title = getFormattedTitle()

  return (
    <Button
      aria-pressed={props.selected}
      variant={props.selected ? 'default' : 'outline'}
      onClick={() => props.onSelect()}
    >
      {title}

      {props.cta && (
        <span>
          {props.cta}
        </span>
      )}
    </Button>
  )
}