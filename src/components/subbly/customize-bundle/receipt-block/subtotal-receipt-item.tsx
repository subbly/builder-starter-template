import { ReceiptItem } from './receipt-item'
import { Box } from 'lucide-react'

type SubtotalReceiptItemProps = {
  subtotal: string
}

export const SubtotalReceiptItem = (props: SubtotalReceiptItemProps) => {
  return (
    <ReceiptItem
      icon={<Box width={16} height={16} />}
      label={<span>Box price before tax</span>}
      value={props.subtotal}
    />
  )
}