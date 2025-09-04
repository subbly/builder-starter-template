import { Button } from '@/components/ui/button'

type BundleQuantitySelectProps = {
  options: number[]
  value: number | null
  onSelect: (value: number) => void
}

export const QuantitySelectBlock = (props: BundleQuantitySelectProps) => {
  const isOptionSelected = (option: number) => {
    return `${option}` === `${props.value}`
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[auto_1fr] gap-2 xl:gap-10 bg-background p-4 rounded-xl">
      <div className="xl:min-w-[320px]">
        <h3 className="text-xl leading-[1.3] tracking-[-0.1px]">
          Quantity
        </h3>

        <p>
          How many bundles would you like?
        </p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {props.options.map((option) => (
          <Button
            key={option}
            role="checkbox"
            aria-pressed={isOptionSelected(option)}
            variant={isOptionSelected(option) ? 'default' : 'outline'}
            onClick={() => props.onSelect(option)}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}