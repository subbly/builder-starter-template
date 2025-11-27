import { ReceiptItem } from './receipt-item'
import { SquareChartGantt } from 'lucide-react'

type ItemPriceReceiptItemProps = {
  price: string
}

export const ItemPriceReceiptItem = (props: ItemPriceReceiptItemProps) => {
  return (
    <ReceiptItem
      icon={<SquareChartGantt width={16} height={16} />}
      label={<span>Price per item</span>}
      value={props.price}
    />
  )
}