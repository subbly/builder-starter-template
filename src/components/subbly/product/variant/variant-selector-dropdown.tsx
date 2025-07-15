'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { startTransition, useState } from 'react'
import {
  VariantSelectorProps,
  shouldRenderSelector,
  findCombination as findCombination,
} from './variant-selector-utils'

export function VariantSelectorDropdown({
  options,
  combinations,
  onSelect: onProductSelected,
}: VariantSelectorProps) {
  const [state, setState] = useState<Record<string, string>>({})

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

  return options.map((option) => {
    const optionNameLowerCase = option.name.toLowerCase()
    const selectedValue = state[optionNameLowerCase]

    const handleValueChange = (value: string) => {
      startTransition(() => {
        updateOption(optionNameLowerCase, value)
      })
    }

    return (
      <div key={option.id} className="w-full">
        <label>{option.name}</label>

        <Select value={selectedValue} onValueChange={handleValueChange}>
          <SelectTrigger className="w-auto min-w-1/2 min-h-[42px] max-w-full bg-background border border-primary text-base px-4 rounded-[8px]">
            <SelectValue placeholder={`Select ${option.name}`} />
          </SelectTrigger>
          <SelectContent>
            {option.values.map((value) => {
              const combination = findCombination(
                value,
                optionNameLowerCase,
                state,
                options,
                combinations
              )
              const inStock = !!combination

              // Create a label that includes price and stock information
              const label = `${value}${!inStock ? ' (Out of Stock)' : ''}`

              return (
                <SelectItem key={value} value={value} disabled={!inStock}>
                  {label}
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </div>
    )
  })
}
