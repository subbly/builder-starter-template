import type { ReactNode } from 'react'
import type { BundleGroup, SelectedBundleItem } from '@subbly/react'
import { BundleGroupSelect } from '../bundle-group-select'

export type SingleProductLayoutProps = {
  groups: BundleGroup[]
  showGroupProduct: boolean
  getSelectedItem: (groupId: number) => SelectedBundleItem | null
  selectItem: (item: SelectedBundleItem) => void
  preferencesBlock?: ReactNode | null
  planSelectBlock?: ReactNode | null
  confirmBlock: ReactNode | null
}

export const SingleProductLayout = (props: SingleProductLayoutProps) => {
  return (
    <div className="max-w-[640px] mx-auto">
      <div className="grid grid-cols-1 gap-6">
        {props.preferencesBlock}

        {props.groups.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {props.groups.map((group) => (
              <BundleGroupSelect
                key={group.id}
                group={group}
                showProduct={props.showGroupProduct}
                selectedItem={props.getSelectedItem(group.id)}
                onSelectedItemChange={(item) => props.selectItem(item)}
              />
            ))}
          </div>
        )}

        {props.planSelectBlock}
        {props.confirmBlock}
      </div>
    </div>
  )
}
