import { BundleItem, useProductImages } from '@subbly/react'
import { useFormatAmount } from '@/hooks/use-format-amount'
import Image from 'next/image'
import { QuantitySelector } from '@/components/subbly/quantity-selector'

type SelectedItemCardProps = {
  bundleItem: BundleItem
  quantity: number
  onQuantityChange: (quantity: number) => void
  showPrice?: boolean
  calculatePriceFn?: (price: number) => number
  hideItemQuantity?: boolean
  addDisabled?: boolean
}

export const SelectedItemCard = (props: SelectedItemCardProps) => {
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
    <div className="flex gap-2 w-full">
      {firstImage && (
        <div className="h-10 w-10 shrink-0">
          <Image
            src={firstImage.url}
            alt={bundleItem.product.name}
            width={80}
            height={80}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 gap-1 w-full">
        <div>
          {name}
        </div>
        <div className="flex items-center justify-between gap-2">
          {props.showPrice && (
            <div className="text-right text-sm">
              {showOriginalPrice && (
                <span className="mr-1 line-through font-light">{formatAmount(originalPrice)}</span>
              )}
              <span className="font-semibold">{formatAmount(price)}</span>
            </div>
          )}

          {!props.hideItemQuantity && (
            <QuantitySelector
              value={quantity}
              min={0}
              maxDisabled={props.addDisabled}
              onChange={(qty) => updateQuantity(qty)}
            />
          )}
        </div>
      </div>
    </div>
  )
}