import type { BundleLayoutProps } from './layout-props'
import { Button } from '@/components/ui/button'
import { ConfirmBlock } from '@/components/subbly/customize-bundle/confirm-block/confirm-block'
import { useState } from 'react'
import { MoveLeft } from 'lucide-react'

type TwoStepLayoutProps = BundleLayoutProps & {
  skipItems?: boolean
}

export const TwoStepLayout = (props: TwoStepLayoutProps) => {
  const [itemStepActive, setItemStepActive] = useState(false)

  return (
    <div>
      {!itemStepActive ? (
        <div className="max-w-[1024px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_328px] items-start lg:gap-10">
          <div className="grid grid-cols-1 gap-3">
            {props.quantitySelectBlock}

            {props.sizeSelectBlock}

            {props.preferencesBlock}
          </div>

          <div className="grid gap-3">
            {props.planSelectBlock}

            {props.skipItems ? props.confirmBlock : (
              <ConfirmBlock
                buttonText="Continue"
                onSubmit={() => setItemStepActive(true)}
              />
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          <div>
            <Button
              variant="ghost"
              onClick={() => setItemStepActive(false)}
            >
              <MoveLeft />
              Previous step
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_328px] items-start lg:gap-10">
            <div className="grid grid-cols-1 gap-3">
              {props.itemSelectBlock}
            </div>

            <div className="grid gap-3">
              {props.selectedItemsBlock}

              {props.receiptBlock}

              {props.confirmBlock}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}