'use client'

import { ProductOption, ProductCombination } from '@/lib/subbly/types'

export interface VariantSelectorProps {
  options: ProductOption[]
  combinations?: ProductCombination[]
  state?: Record<string, string>
  onSelect?: (combination: ProductCombination) => void
}

export function shouldRenderSelector(options: ProductOption[]): boolean {
  const hasNoOptionsOrJustOneOption =
    !options.length || (options.length === 1 && options[0]?.values.length === 1)

  return !hasNoOptionsOrJustOneOption
}

export function findCombination(
  optionValue: string,
  optionNameLowerCase: string,
  currentState: Record<string, string>,
  options: ProductOption[],
  combinations?: ProductCombination[]
): ProductCombination | undefined {
  const optionParams = { ...currentState, [optionNameLowerCase]: optionValue }

  // Filter out invalid state parameters
  const filtered = Object.entries(optionParams).filter(([key, value]) =>
    options.find(
      (option) => option.name.toLowerCase() === key && option.values.includes(value)
    )
  )

  // Find matching combination in the array
  const combination = combinations?.find((combination) =>
    filtered.every(([key, value]) => combination[key] === value && combination.inStock)
  )

  return combination
}