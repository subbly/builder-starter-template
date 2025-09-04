import type { BundleItemsParamFilter, BundleFilter, AttributeValue } from '@subbly/react'
import { Button } from '@/components/ui/button'

type FilterAttributesFieldProps = {
  filter: BundleFilter
  values: BundleItemsParamFilter | null
  onChange: (value: BundleItemsParamFilter | null) => void
}

export const FilterAttributesField = (props: FilterAttributesFieldProps) => {
  const isValueSelected = (valueId: AttributeValue['id']) => {
    return props.values?.values.includes(valueId)
  }

  const selectValue = (valueId: AttributeValue['id']) => {
    const values = isValueSelected(valueId) ? [] : [valueId]
    const filterValue = values.length > 0 ? {
      attributeId: props.filter.attributeId,
      values
    } : null
    props.onChange(filterValue)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="text-sm leading-[1.3] tracking-[-0.1px]">
        Filter products
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {props.filter.values.map((attributeValue) => (
          <Button
            key={attributeValue.id}
            aria-pressed={isValueSelected(attributeValue.id)}
            variant={isValueSelected(attributeValue.id) ? 'default' : 'outline'}
            onClick={() => selectValue(attributeValue.id)}
          >
            {attributeValue.value}
          </Button>
        ))}
      </div>
    </div>
  )
}