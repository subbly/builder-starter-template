import { useBundleItemsForm } from '@subbly/react'
import type { Bundle, SelectedBundleItem } from '@subbly/react'
import { LoadingProgress } from './items-loading'
import { ItemOptionCard } from './item-option-card'
import { FilterSearchField } from './filter-search-field'
import { FilterAttributesField } from './filter-attributes-field'
import { useBundleItemsQuery } from '@/lib/subbly/queries/use-bundle-items-query'
import { AnimatePresence, motion } from 'motion/react'

type ItemSelectBlockProps = {
  selectedItems: SelectedBundleItem[]
  bundle: Bundle
  calculateItemPrice?: (price: number) => number
  onItemsChange: (items: SelectedBundleItem[]) => void
  addItemsDisabled?: boolean
}

export const ItemSelectBlock = (props: ItemSelectBlockProps) => {
  const {
    showItemPrice,
    checkItemSelected,
    getCurrentItemQuantity,
    updateItemQuantity,
    filtersForm,
    updateFiltersForm
  } = useBundleItemsForm({
    bundle: props.bundle,
    selectedItems: props.selectedItems,
    onItemsChange: props.onItemsChange
  })

  const { data: itemsResponse, isFetching } = useBundleItemsQuery({
    bundleId: props.bundle.id,
    filters: filtersForm
  })

  const listEmpty = itemsResponse?.data.length === 0

  return (
    <div className="grid grid-cols-1 gap-4 bg-background p-4 rounded-xl">
      <p className="flex flex-col gap-1 text-xl leading-[1.3] tracking-[-0.1px]">
        Choose which items to include in your box
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
        {props.bundle.filters && props.bundle.filters.length > 0 && (
          <FilterAttributesField
            filter={props.bundle.filters[0]}
            values={filtersForm.filters[0]}
            onChange={(filter) => updateFiltersForm({
              filters: filter ? [filter] : []
            })}
          />
        )}

        {props.bundle.searchable && (
          <FilterSearchField
            value={filtersForm.query}
            onChange={(query) => {
              updateFiltersForm({
                query
              })
            }}
          />
        )}
      </div>

      <div>
        <AnimatePresence>
          {isFetching || !itemsResponse ? (
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
                {itemsResponse.data.map((item) => (
                  <ItemOptionCard
                    key={item.id}
                    bundleItem={item}
                    selected={checkItemSelected(item.id)}
                    quantity={getCurrentItemQuantity(item.id)}
                    calculatePriceFn={props.calculateItemPrice}
                    showPrice={showItemPrice}
                    addDisabled={props.addItemsDisabled}
                    onQuantityChange={(quantity) => updateItemQuantity(item, quantity)}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}