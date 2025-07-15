'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Minus, Plus } from 'lucide-react'
import { useState } from 'react'

export interface QuantitySelectorProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  className?: string
}

export const QuantitySelector = ({
  value,
  onChange,
  min = 1,
  max,
  className,
}: QuantitySelectorProps) => {
  const [quantity, setQuantity] = useState<number>(value)

  const handleDecrease = () => {
    if (quantity > min) {
      const newValue = quantity - 1
      setQuantity(newValue)
      onChange(newValue)
    }
  }

  const handleIncrease = () => {
    if (max === undefined || quantity < max) {
      const newValue = quantity + 1
      setQuantity(newValue)
      onChange(newValue)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value)
    if (!isNaN(newValue) && newValue >= min && (max === undefined || newValue <= max)) {
      setQuantity(newValue)
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
        disabled={quantity <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        type="number"
        min={min}
        max={max}
        value={quantity}
        onChange={handleChange}
        className="h-8 w-16 rounded-none text-center [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-l-none"
        onClick={handleIncrease}
        disabled={max !== undefined && quantity >= max}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}
