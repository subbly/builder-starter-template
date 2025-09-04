import { useBundleItemsForm } from '@subbly/react'
import type { Bundle, SelectedBundleItem } from '@subbly/react'
import { Button } from '@/components/ui/button'
import { SelectedItemCard } from './selected-item-card'

type SelectedItemBlockProps = {
  bundle: Bundle
  selectedItems: SelectedBundleItem[]
  onItemsChange: (items: SelectedBundleItem[]) => void
  quantityChangeDisabled?: boolean
  calculateItemPrice?: (price: number) => number
  hideItemQuantity?: boolean
  addDisabled?: boolean
}

export const SelectedItemBlock = (props: SelectedItemBlockProps) => {
  const {
    showItemPrice,
    updateItemQuantity,
  } = useBundleItemsForm({
    bundle: props.bundle,
    selectedItems: props.selectedItems,
    onItemsChange: props.onItemsChange
  })

  const removeAllItems = () => {
    props.onItemsChange([])
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-3">
        <div className="flex items-center justify-between mb-2">
          <div>Your selection</div>

          {!props.quantityChangeDisabled && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeAllItems()}
            >
              Remove all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4">
          {props.selectedItems.map((selectedItem) => (
            <SelectedItemCard
              key={selectedItem.item.id}
              bundleItem={selectedItem.item}
              quantity={selectedItem.quantity}
              showPrice={showItemPrice}
              calculatePriceFn={props.calculateItemPrice}
              hideItemQuantity={props.hideItemQuantity}
              addDisabled={props.addDisabled}
              onQuantityChange={(qty) => updateItemQuantity(selectedItem.item, qty)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}