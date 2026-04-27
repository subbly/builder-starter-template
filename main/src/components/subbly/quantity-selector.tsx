'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Minus, Plus } from 'lucide-react'

export interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  maxDisabled?: boolean
  className?: string
}

export const QuantitySelector = ({
  value,
  onChange,
  min = 1,
  max,
  className,
  maxDisabled,
}: QuantitySelectorProps) => {

  const handleDecrease = () => {
    if (value > min) {
      const newValue = Math.max(value - 1, min)
      onChange(newValue)
    }
  }

  const handleIncrease = () => {
    if (max === undefined || value < max) {
      const newValue = Math.min(value + 1, max || Infinity)
      onChange(newValue)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    if (!isNaN(newValue) && newValue >= min && (max === undefined || newValue <= max)) {
      onChange(newValue)
    }
  }

  const decreaseDisabled = value <= min
  const increaseDisabled = maxDisabled || (max !== undefined && value >= max)

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-md border border-input bg-background shadow-xs transition-[color,box-shadow] has-[input:focus-visible]:border-ring has-[input:focus-visible]:ring-ring/50 has-[input:focus-visible]:ring-[3px]',
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-r-none rounded-l-md text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={handleDecrease}
        disabled={decreaseDisabled}
        aria-label="Decrease quantity"
      >
        <Minus className="size-4" />
      </Button>

      <input
        type="number"
        inputMode="numeric"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        aria-label="Quantity"
        className="h-8 w-10 border-0 bg-transparent text-center text-sm font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="rounded-l-none rounded-r-md text-muted-foreground hover:text-foreground disabled:opacity-40"
        onClick={handleIncrease}
        disabled={increaseDisabled}
        aria-label="Increase quantity"
      >
        <Plus className="size-4" />
      </Button>
    </div>
  )
}