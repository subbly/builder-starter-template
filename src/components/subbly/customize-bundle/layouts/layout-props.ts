import type { ReactNode } from 'react'

export type BundleLayoutProps = {
  quantitySelectBlock?: ReactNode | null
  sizeSelectBlock?: ReactNode | null
  preferencesBlock?: ReactNode | null
  itemSelectBlock?: ReactNode | null
  planSelectBlock?: ReactNode | null
  selectedItemsBlock?: ReactNode | null
  receiptBlock?: ReactNode | null
  confirmBlock: ReactNode | null
}