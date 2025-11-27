import { ReceiptItem } from './receipt-item'
import { Truck } from 'lucide-react'

export const ShippingReceiptItem = () => {
  return (
    <ReceiptItem
      icon={<Truck width={16} height={16} />}
      label={<span>Shipping will be added at checkout</span>}
    />
  )
}