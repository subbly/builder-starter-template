import { BundleItem, ProductOneTime, useProductImages } from '@subbly/react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { QuantitySelector } from '@/components/subbly/product/quantity/quantity-selector'
import { Button } from '@/components/ui/button'
import { useFormatAmount } from '@/hooks/use-format-amount'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { cn } from '@/lib/utils'

type ProductOptionCardProps = {
  product: ProductOneTime
  items: BundleItem[]
  onQuantityChange: (quantity: number) => void
  onItemChange: (item: BundleItem) => void
  selectedItem?: BundleItem | null
  quantity?: number
  showPrice?: boolean
  hideQuantity?: boolean
  allowMultipleItemsInGroup?: boolean
  addDisabled?: boolean
  calculatePriceFn?: (price: number) => number
}

export const ProductOptionCard = (props: ProductOptionCardProps) => {
  const { product } = props

  const [currentItem, setCurrentItem] = useState(props.selectedItem || props.items[0])

  const { formatAmount } = useFormatAmount()
  const { firstImage } = useProductImages({
    images: props.product?.images || []
  })

  const quantity = props.quantity || 0

  const updateQuantity = (qty: number) => {
    props.onQuantityChange(Math.max(qty, 0))
  }

  const extraPrice = currentItem.extraPrice || 0
  const originalPrice = currentItem.product.price + extraPrice
  const price = props.calculatePriceFn ? props.calculatePriceFn(originalPrice) : originalPrice
  const showOriginalPrice = originalPrice !== price

  const onItemSelect = (itemId: string) => {
    const item = props.items.find((item) => `${item.id}` === itemId)

    if (!item) {
      return
    }

    setCurrentItem(item)
    if (!props.allowMultipleItemsInGroup && !props.addDisabled) {
      props.onItemChange(item)
    }
  }

  return (
    <div className={cn(
      'border border-gray-200 rounded-xl grid grid-cols-1 gap-3 p-4 transition-colors',
      props.selectedItem && 'border-gray-900'
    )}>
      {firstImage && (
        <div className="w-full h-full">
          <Image
            src={firstImage.url}
            alt={product.name}
            width={672}
            height={448}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-[1fr]">
        <div>{product.name}</div>
      </div>

      <div>
        <Select
          value={`${currentItem.id}`}
          onValueChange={(id) => onItemSelect(id)}
        >
          <SelectTrigger
            className="w-full"
          >
            <SelectValue>
              {currentItem.product.name} - {formatAmount(currentItem.product.price + currentItem.extraPrice)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {props.items.map((item) => (
              <SelectItem
                key={item.id}
                value={`${item.id}`}
              >
                {item.product.name} - {formatAmount(item.product.price + item.extraPrice)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between min-h-9">
        {props.showPrice && !props.allowMultipleItemsInGroup && (
          <div>
            {showOriginalPrice && (
              <span className="mr-1 text-right text-sm font-light line-through">{formatAmount(originalPrice)}</span>
            )}

            <span className="font-semibold">{formatAmount(price)}</span>
          </div>
        )}

        <AnimatePresence>
          {!props.selectedItem || props.allowMultipleItemsInGroup ? (
            <motion.div
              key="add-item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                disabled={props.addDisabled}
                onClick={() => props.onItemChange(currentItem)}
              >
                Add
              </Button>
            </motion.div>
          ) : !props.hideQuantity && (
            <motion.div
              key="select-quantity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <QuantitySelector
                value={quantity}
                min={0}
                maxDisabled={props.addDisabled}
                onChange={(qty) => updateQuantity(qty)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}