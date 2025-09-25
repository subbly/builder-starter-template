import { useFormatAmount } from '@/hooks/use-format-amount'
import { DiscountReceiptItem } from './discount-receipt-item'
import { ItemPriceReceiptItem } from './item-price-receipt-item'
import { SubtotalReceiptItem } from './subtotal-receipt-item'
import { ShippingReceiptItem } from './shipping-receipt-item'
import type { Bundle, BundleDiscountRange } from '@subbly/react'
import { useMemo } from 'react'

type ReceiptBlockProps = {
  subtotal: number | null
  discount: number | null
  discountType: Bundle['discountType']
  discountRange: BundleDiscountRange | null
  pricePerItem: number | null
}

export const ReceiptBlock = (props: ReceiptBlockProps) => {
  const { formatAmount } = useFormatAmount()

  const hasAnyItem = [props.discount, props.subtotal, props.pricePerItem].some((v) => !!v)
  const discountRule = useMemo(() => {
    const amountOff = props.discountRange?.amountOff
    const percentOff = props.discountRange?.percentOff

    if (!amountOff && !percentOff) {
      return ''
    }

    const type = props.discountType
    switch (true) {
      case !!amountOff && type === 'per_item':
        return `${formatAmount(amountOff)} per item`
      case !!amountOff:
        return formatAmount(amountOff)
      case !!percentOff:
        return `-${percentOff}%`
      default:
        return ''
    }
  }, [props.discountRange?.amountOff, props.discountRange?.percentOff, props.discountType, formatAmount])

  if (!hasAnyItem) {
    return null
  }

  return (
    <div className="bg-background p-4 rounded-xl">
      <ul className="grid grid-cols-1 gap-3">
        {!!props.discount && (
          <li>
            <DiscountReceiptItem
              discountRule={discountRule}
              discount={formatAmount(-props.discount)}
            />
          </li>
        )}

        {!!props.pricePerItem && (
          <li>
            <ItemPriceReceiptItem
              price={formatAmount(props.pricePerItem)}
            />
          </li>
        )}

        {!!props.subtotal && (
          <li>
            <SubtotalReceiptItem
              subtotal={formatAmount(props.subtotal)}
            />
          </li>
        )}

        <ShippingReceiptItem />
      </ul>
    </div>
  )
}