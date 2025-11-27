import type { ReactNode } from 'react'

export type FixedLayoutProps = {
  planSelectBlock?: ReactNode | null
  confirmBlock: ReactNode | null
}

export const FixedLayout = (props: FixedLayoutProps) => {
  return (
    <div className="max-w-[640px] mx-auto">
      <div className="grid grid-cols-1 gap-6">
        {props.planSelectBlock}
        {props.confirmBlock}
      </div>
    </div>
  )
}
