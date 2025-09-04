import { Button } from '@/components/ui/button'
import type { BundleValidationRule } from '@subbly/react'
import { useFormatAmount } from '@/hooks/use-format-amount'

type ConfirmBlockProps = {
  validationRule: BundleValidationRule | null
  onSubmit: () => void
}

export const ConfirmBlock = (props: ConfirmBlockProps) => {
  const { formatAmount } = useFormatAmount()

  const getValidationMessage = (rule: BundleValidationRule | null): string => {
    if (!rule) {
      return ''
    }

    switch (rule.key) {
      case 'itemMinQuantity':
        return `Select ${rule.delta} more`
      case 'itemMaxQuantity':
        return `Remove ${rule.delta} ${rule.delta === 1 ? 'item' : 'items'}`
      case 'itemsMinTotal':
        return `Select at least ${formatAmount(rule.delta)} more`
      case 'itemsMaxTotal':
        return `Remove items worth ${formatAmount(rule.delta)}`
      default:
        return ''
    }
  }

  const message = getValidationMessage(props.validationRule)

  return (
    <div className="flex flex-col gap-3 bg-background p-4 rounded-xl">
      {message && (
        <div className="text-center">
          {message}
        </div>
      )}

      <Button
        disabled={!!message}
        className="w-full"
        onClick={() => props.onSubmit()}
      >
        Add to cart
      </Button>
    </div>
  )
}