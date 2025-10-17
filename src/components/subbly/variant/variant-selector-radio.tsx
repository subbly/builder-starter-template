'use client'

import { useState } from 'react'
import {
  findCombination,
  shouldRenderSelector,
  VariantSelectorProps,
} from './variant-selector-utils'
import { Button } from '@/components/ui/button'

export function VariantSelectorRadio({
  options,
  combinations,
  state: defaultState,
  onSelect: onProductSelected,
}: VariantSelectorProps) {
  const [state, setState] = useState<Record<string, string>>(defaultState ? defaultState : {})

  const updateOption = (name: string, value: string) => {
    const newState = { ...state, [name]: value }

    setState(newState)

    const combination = findCombination(value, name, newState, options, combinations)

    if (combination && onProductSelected && options.length == Object.keys(newState).length) {
      onProductSelected(combination)
    }
  }

  if (!shouldRenderSelector(options)) {
    return null
  }

  return options.map((option) => (
    <form key={option.id}>
      <dl className="mb-1">
        <dt className="mb-2 text-sm">{option.name}</dt>
        <dd className="flex flex-wrap gap-2">
          {option.values.map((value) => {
            const optionNameLowerCase = option.name.toLowerCase()
            const combination = findCombination(
              value,
              optionNameLowerCase,
              state,
              options,
              combinations
            )
            const inStock = !!combination

            // The option is active if it's in the selected options
            const selected = state[optionNameLowerCase] === value

            return (
              <Button
                size={'sm'}
                variant={selected ? 'default' : 'outline'}
                formAction={() => {
                  updateOption(optionNameLowerCase, value)
                }}
                key={value}
                aria-disabled={!inStock}
                disabled={!inStock}
                title={`${option.name} ${value}${!inStock ? ' (Out of Stock)' : ''}`}
              >
                {value}
              </Button>
            )
          })}
        </dd>
      </dl>
    </form>
  ))
}
