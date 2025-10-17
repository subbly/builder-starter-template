import type { BundleLayoutProps } from './layout-props'

type OneStepLayoutProps = BundleLayoutProps

export const OneStepLayout = (props: OneStepLayoutProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_328px] items-start lg:gap-10">
      <div className="grid grid-cols-1 gap-3">
        {props.quantitySelectBlock}

        {props.sizeSelectBlock}

        {props.preferencesBlock}

        {props.itemSelectBlock}
      </div>

      <div className="grid gap-3">
        {props.planSelectBlock}

        {props.selectedItemsBlock}

        {props.receiptBlock}

        {props.confirmBlock}
      </div>
    </div>
  )
}