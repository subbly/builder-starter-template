import type { ReactNode } from 'react'
import type { Bundle } from '@subbly/react'

export type FixedLayoutProps = {
  bundle: Bundle
  planSelectBlock?: ReactNode | null
  confirmBlock: ReactNode | null
}

export const FixedLayout = (props: FixedLayoutProps) => {
  return (
    <div className="grid grid-cols-1 gap-6">
      <span className="text-xl leading-[1.3] tracking-[-0.1px]">
        {props.bundle.name}
      </span>

      {props.planSelectBlock}
      {props.confirmBlock}
    </div>
  )
}
