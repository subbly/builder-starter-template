import { useMemo } from 'react'
import Image from 'next/image'
import { VariantSelector } from '../product/variant/variant-selector'
import { useProductImages, useVariantCombinations } from '@subbly/react'
import type { SelectedBundleItem, BundleGroup, ProductVariantCombination } from '@subbly/react'

export type BundleGroupSelectProps = {
  group: BundleGroup
  selectedItem: SelectedBundleItem | null
  showProduct?: boolean
  onSelectedItemChange: (item: SelectedBundleItem) => void
}

export const BundleGroupSelect = (props: BundleGroupSelectProps) => {
  const { firstImage } = useProductImages({
    images: props.group.product.images,
  })

  const variants = useMemo(() => {
    return props.group.items.map((item) => item.product)
  }, [props.group.items])

  const variantCombinations = useVariantCombinations({
    variants
  })

  const handleProductSelected = (combination: ProductVariantCombination) => {
    const item = props.group.items.find((item) => item.product.id === combination.id)

    if (!item) {
      return
    }

    props.onSelectedItemChange({
      item,
      quantity: 1,
    })
  }

  const defaultState = props.selectedItem?.item.product.options.reduce((acc, option) => {
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
          combinations={variantCombinations}
          state={defaultState}
          onSelect={(combination) => handleProductSelected(combination)}
        />
      </div>
    </div>
  )
}
