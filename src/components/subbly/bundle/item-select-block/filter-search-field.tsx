import { Input } from '@/components/ui/input'

type FilterSearchFieldProps = {
  value?: string
  onChange: (value: string) => void
}

export const FilterSearchField = (props: FilterSearchFieldProps) => {
  return (
    <div className="flex flex-col gap-1">
      <h4 className="text-sm leading-[1.3] tracking-[-0.1px]">
        Search products
      </h4>

      <Input
        value={props.value || ''}
        type="search"
        onChange={(ev) => props.onChange(ev.target.value)}
      />
    </div>
  )
}