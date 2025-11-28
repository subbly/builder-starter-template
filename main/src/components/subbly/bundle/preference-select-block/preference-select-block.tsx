import type { BundlePreference, BundlePayloadPreference } from '@subbly/react'
import { useMemo } from 'react'
import { PreferenceOptionCard } from './preference-option-card'
import type { ClassProp } from 'class-variance-authority/types'
import { cn } from '@/lib/utils'

type BundlePreferenceSelectProps = ClassProp & {
  options: BundlePreference[]
  value: BundlePayloadPreference[]
  onChange: (value: BundlePayloadPreference[]) => void
}

export const PreferenceSelectBlock = (props: BundlePreferenceSelectProps) => {
  const valueDictionary = useMemo(() => {
    return props.value.reduce<Record<BundlePayloadPreference['attributeId'], BundlePayloadPreference['values']>>((acc, preference) => {
      acc[preference.attributeId] = preference.values
      return acc
    }, {})
  }, [props.value])

  const getPreferenceValue = (preferenceId: BundlePreference['id']) => {
    return valueDictionary[preferenceId] || []
  }

  const onPreferenceUpdate = (preference: BundlePayloadPreference) => {
    if (preference.values.length > 0) {
      props.onChange([
        ...props.value.filter((p) => p.attributeId !== preference.attributeId),
        preference
      ])
    } else {
      props.onChange(props.value.filter((p) => p.attributeId !== preference.attributeId))
    }
  }

  return (
    <div className={cn('grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-2 xl:gap-10 bg-background p-4 rounded-xl', props.className)}>
      <div className="xl:min-w-[320px]">
        <h3 className="text-xl leading-[1.3] tracking-[-0.1px]">
          Choose your preferences

        </h3>
      </div>

      {props.options.map((option) => (
        <PreferenceOptionCard
          key={option.id}
          option={option}
          values={getPreferenceValue(option.attributeId)}
          onSelect={onPreferenceUpdate}
        />
      ))}
    </div>
  )
}