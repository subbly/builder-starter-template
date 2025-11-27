'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  return (
    <div className={`flex items-center ${className || ''}`}>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-r-none"
        onClick={handleDecrease}
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-l-none"
        onClick={handleIncrease}
        disabled={maxDisabled || (max !== undefined && value >= max)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
