import { VariantSelectorProps } from './variant-selector-utils'
import { VariantSelectorRadio } from './variant-selector-radio'
import { VariantSelectorDropdown } from './variant-selector-dropdown'

type SelectorType = 'radio' | 'dropdown'

interface VariantSelectorComponentProps extends VariantSelectorProps {
  type?: SelectorType
}

export function VariantSelector({
  options,
  combinations,
  state,
  type = 'radio',
  onSelect: onProductSelected,
}: VariantSelectorComponentProps) {
  if (type === 'dropdown') {
    return (
      <VariantSelectorDropdown
        options={options}
        combinations={combinations}
        state={state}
        onSelect={onProductSelected}
      />
    )
  }

  return (
    <VariantSelectorRadio
      options={options}
      combinations={combinations}
      state={state}
      onSelect={onProductSelected}
    />
  )
}
