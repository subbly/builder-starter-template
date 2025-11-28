import { AnimatePresence, motion } from 'motion/react'
import { ProductOptionCard } from './product-option-card'
import { LoadingProgress } from './items-loading'
import { useBundleGroupsQuery } from '@/lib/subbly/queries/use-bundle-groups-query'
import { useBundleProductGroupedItemsForm } from '@subbly/react'
import type { Bundle, SelectedBundleItem } from '@subbly/react'
import { useEffect } from 'react'

type ProductGroupedItemSelectBlockProps = {
  selectedItems: SelectedBundleItem[]
  bundle: Bundle
  calculateItemPrice?: (price: number) => number
  hideItemQuantity?: boolean
  allowMultipleItemsInGroup?: boolean
  addItemsDisabled?: boolean
  onItemsChange: (items: SelectedBundleItem[]) => void
}

export const ProductGroupedItemSelectBlock = (props: ProductGroupedItemSelectBlockProps) => {
  const {
    showItemPrice,
    getSelectedItemForProduct,
    updateItemQuantity,
    selectItem,
    autoSelectGroupItems
  } = useBundleProductGroupedItemsForm({
    bundle: props.bundle,
    selectedItems: props.selectedItems,
    onItemsChange: props.onItemsChange,
    allowMultipleItemsInGroup: props.allowMultipleItemsInGroup
  })

  const { data: groupsResponse, isFetching } = useBundleGroupsQuery({
    bundleId: props.bundle.id
  })

  const hasSelectedItems = props.selectedItems.length > 0
  const shouldAutoSelectItems = props.bundle.selectionType === 'single_product'
  const listEmpty = groupsResponse?.data.length === 0

  useEffect(() => {
    if (groupsResponse?.data && groupsResponse?.data.length > 0 && !hasSelectedItems && shouldAutoSelectItems) {
      autoSelectGroupItems(groupsResponse.data)
    }
  }, [groupsResponse?.data, autoSelectGroupItems, hasSelectedItems, shouldAutoSelectItems])

  return (
    <div className="grid grid-cols-1 gap-4 bg-background p-4 rounded-xl">
      <p className="flex flex-col gap-1 text-xl leading-[1.3] tracking-[-0.1px]">
        Choose which items to include in your box
      </p>

      <div>
        <AnimatePresence>
          {isFetching || !groupsResponse ? (
            <motion.div
              key="items-loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[120px] flex items-center justify-center"
            >
              <LoadingProgress />
            </motion.div>
          ) : listEmpty ? (
            <motion.div
              key="items-empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-[120px] flex items-center justify-center"
            >
              No matching products
            </motion.div>
          ) : (
            <motion.div
              key="items-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 gap-2"
            >
              <div
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
              >
                {groupsResponse.data.map((group) => {
                  const selectedItem = getSelectedItemForProduct(group.productId)
                  return (
                    <ProductOptionCard
                      key={group.id}
                      product={group.product}
                      items={group.items}
                      selectedItem={selectedItem?.item}
                      quantity={selectedItem?.quantity}
                      onItemChange={(bundleItem) => selectItem(bundleItem)}
                      calculatePriceFn={props.calculateItemPrice}
                      showPrice={showItemPrice}
                      hideQuantity={props.hideItemQuantity}
                      allowMultipleItemsInGroup={props.allowMultipleItemsInGroup}
                      addDisabled={props.addItemsDisabled}
                      onQuantityChange={(quantity) => {
                        updateItemQuantity(group.productId, quantity)
                      }}
                    />
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}