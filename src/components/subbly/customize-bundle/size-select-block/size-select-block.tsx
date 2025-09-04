import type { BundleRuleset } from '@subbly/api-client'
import { SizeOptionCard } from './size-option-card'

type SizeSelectBlock = {
  options: BundleRuleset[]
  value: BundleRuleset['id']
  onChange: (value: BundleRuleset['id']) => void
  showSizeName?: boolean
}

export const SizeSelectBlock = (props: SizeSelectBlock) => {
  const isOptionSelected = (option: number) => {
    return option === props.value
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-2 xl:gap-10 bg-background p-4 rounded-xl">
      <div className="xl:min-w-[320px]">
        <h3 className="text-xl leading-[1.3] tracking-[-0.1px]">
          Box size
        </h3>

        <p>
          Select the box size
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {props.options.map((option) => (
          <SizeOptionCard
            key={option.id}
            selected={isOptionSelected(option.id)}
            ruleset={option}
            onSelect={() => props.onChange(option.id)}
            showSizeName={props.showSizeName}
          />
        ))}
      </div>
    </div>
  )
}