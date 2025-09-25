import type { BundlePreference, BundlePayloadPreference, AttributeValue } from '@subbly/react'
import { Button } from '@/components/ui/button'

type BundlePreferenceOptionProps = {
  option: BundlePreference
  values: BundlePayloadPreference['values']
  onSelect: (payload: BundlePayloadPreference) => void
}

export const PreferenceOptionCard = (props: BundlePreferenceOptionProps) => {
  const isValueSelected = (attrValue: AttributeValue) => {
    return props.values?.includes(attrValue.id)
  }

  const selectValue = (attrValue: AttributeValue) => {
    props.onSelect({
      attributeId: props.option.attributeId,
      values: props.values.includes(attrValue.id) ? props.values.filter((v: number) => v !== attrValue.id) : [...props.values, attrValue.id]
    })
  }

  return (
    <div className="flex flex-col gap-1">
      <div>
        {props.option.title}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {props.option.values.map((attrValue) => (
          <Button
            key={attrValue.id}
            aria-pressed={isValueSelected(attrValue)}
            variant={isValueSelected(attrValue) ? 'default' : 'outline'}
            onClick={() => selectValue(attrValue)}
          >
            {attrValue.value}
          </Button>
        ))}
      </div>
    </div>
  )
}