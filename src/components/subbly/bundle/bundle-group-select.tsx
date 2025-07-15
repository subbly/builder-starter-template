import { BundleGroup, ProductCombination } from '@/lib/subbly/types'
import Image from 'next/image'
import { useProductGallery } from '@/hooks/subbly/use-product-images'

import { VariantSelector } from '../product/variant/variant-selector'
import { SelectedBundleItem } from '@/types'

export type BundleGroupSelectProps = {
  group: BundleGroup
  selectedItem: SelectedBundleItem | null
  showProduct?: boolean
  onSelectedItemChange: (item: SelectedBundleItem) => void
}

export const BundleGroupSelect = (props: BundleGroupSelectProps) => {
  const { firstImage } = useProductGallery({
    images: props.group.product.images,
  })

  const handleProductSelected = (combination: ProductCombination) => {
    const item = props.group.items.find((item) => item.variant.id === combination.id)

    if (!item) {
      return
    }

    props.onSelectedItemChange({
      item,
      quantity: 1,
    })
  }

  const defaultState = props.selectedItem?.item.variant.options.reduce((acc, option) => {
    return {
      ...acc,
      [option.name.toLowerCase()]: option.value,
    }
  }, {})

  return (
    <div className="flex flex-col gap-2 md:gap-4">
      {props.showProduct && (
        <div className="flex items-center gap-2 md:gap-3">
          {firstImage && (
            <div className="shrink-0 w-12 h-12">
              <Image
                src={firstImage.url}
                alt="Product image"
                width={48}
                height={48}
                loading="lazy"
                className="object-cover w-full h-full"
              />
            </div>
          )}
          <span className="text-xl leading-[1.3] tracking-[-0.1px]">
            {props.group.product.name}
          </span>
        </div>
      )}

      <div className="w-full grid grid-cols-1 gap-2">
        <VariantSelector
          options={props.group.product.options}
          combinations={props.group.product.combinations}
          state={defaultState}
          onSelect={(combination) => handleProductSelected(combination)}
        />
      </div>
    </div>
  )
}
