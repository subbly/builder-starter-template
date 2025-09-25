import { BundleItem, useProductImages } from '@subbly/react'
import { useFormatAmount } from '@/hooks/use-format-amount'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { QuantitySelector } from '@/components/subbly/quantity-selector'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/utils'

type ItemOptionCardProps = {
  bundleItem: BundleItem
  onQuantityChange: (quantity: number) => void
  selected?: boolean
  quantity?: number
  showPrice?: boolean
  addDisabled?: boolean
  calculatePriceFn?: (price: number) => number
}

export const ItemOptionCard = (props: ItemOptionCardProps) => {
  const { bundleItem } = props

  const { formatAmount } = useFormatAmount()
  const { firstImage } = useProductImages({
    images: bundleItem.product.parent?.images || []
  })

  const quantity = props.quantity || 0

  const name = `${bundleItem.product.parent.name} - ${bundleItem.product.name}`
  const extraPrice = bundleItem.extraPrice || 0
  const originalPrice = bundleItem.product.price + extraPrice
  const price = props.calculatePriceFn ? props.calculatePriceFn(originalPrice) : originalPrice
  const showOriginalPrice = originalPrice !== price

  const updateQuantity = (qty: number) => {
    props.onQuantityChange(Math.max(qty, 0))
  }

  return (
    <div className={cn(
      'border border-gray-200 rounded-xl grid grid-cols-1 gap-3 p-4 transition-colors',
      props.selected && 'border-gray-900'
    )}>
      {firstImage && (
        <div className="w-full h-full">
          <Image
            src={firstImage.url}
            alt={bundleItem.product.name}
            width={672}
            height={448}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-[1fr]">
        <div>{name}</div>
      </div>

      <div className="flex items-center justify-between">
        {props.showPrice && (
          <div>
            {showOriginalPrice && (
              <span className="mr-1 text-right text-sm font-light line-through">{formatAmount(originalPrice)}</span>
            )}

            <span className="font-semibold">{formatAmount(price)}</span>
          </div>
        )}

        <AnimatePresence>
          {props.selected ? (
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
          ) : (
            <motion.div
              key="add-item"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Button
                onClick={() => updateQuantity(1)}
              >
                Add
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}