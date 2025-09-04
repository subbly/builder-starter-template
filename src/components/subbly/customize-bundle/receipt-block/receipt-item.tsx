import { ReactNode } from 'react'

type ReceiptItemProps = {
  icon?: ReactNode
  label: ReactNode
  value?: string | null
}

export const ReceiptItem = (props: ReceiptItemProps) => {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {props.icon && (
          <div>
            {props.icon}
          </div>
        )}

        <div>
          {props.label}
        </div>
      </div>

      {props.value && (
        <div>
          {props.value}
        </div>
      )}
    </div>
  )
}