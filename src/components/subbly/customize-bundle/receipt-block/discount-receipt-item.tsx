import { ReceiptItem } from './receipt-item'
import { Percent } from 'lucide-react'

type DiscountReceiptItemProps = {
  discountRule: string | null
  discount: string
}

export const DiscountReceiptItem = (props: DiscountReceiptItemProps) => {
  return (
    <ReceiptItem
      icon={<Percent width={16} height={16} />}
      label={<span>Discount {props.discountRule && <span>{props.discountRule}</span>}</span>}
      value={props.discount}
    />
  )
}