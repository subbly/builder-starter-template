import * as motion from 'motion/react-client'
import { AnimatePresence } from 'motion/react'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type PlanOptionCardProps = {
  title: string
  price?: string
  originalPrice?: string | null
  highlightText?: string | null
  selected: boolean
  description?: ReactNode
  nestedOptions?: ReactNode
  onSelect: () => void
}

export const PlanOptionCard = (props: PlanOptionCardProps) => {
  return (
    <div
      {...(props.nestedOptions && props.selected
        ? {}
        : {
            role: 'button',
            'aria-checked': props.selected,
          })}
      className={cn(
        'w-full grid grid-cols-1 bg-background border border-input rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gray-950 cursor-pointer',
        props.selected && 'border-primary',
        props.nestedOptions && props.selected && 'cursor-default'
      )}
      onClick={() => {
        if (!props.selected) {
          props.onSelect()
        }
      }}
    >
      <span className={cn(
        'p-3 grid grid-cols-1 gap-1 transition-colors',
        props.nestedOptions && 'border-b',
        props.selected && 'border-primary'
      )}>
        <span className="flex items-center gap-4">
          <span
            className={cn(
              '-mt-1 relative inline-block h-4 w-4 rounded-full transition-colors border shrink-0',
              props.selected && 'bg-background border-primary'
            )}
          >
            <AnimatePresence>
              {props.selected && (
                <motion.span
                  className="absolute inset-1 bg-primary rounded-full"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                />
              )}
            </AnimatePresence>
          </span>

          <span className="flex-grow inline-flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2 text-base font-medium">
            {props.title}
          </span>

          {props.price && (
            <span className="self-baseline text-xl font-bold">
              {props.price}
              {!!props.originalPrice && (
                <span className="relative -top-0.5 ml-2 text-foreground text-xs line-through font-bold">
                  {props.originalPrice}
                </span>
              )}
            </span>
          )}
        </span>
      </span>

      {props.description}

      {props.nestedOptions}
    </div>
  )
}
