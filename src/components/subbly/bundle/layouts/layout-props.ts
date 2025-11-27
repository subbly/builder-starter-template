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

export type { FixedLayoutProps } from './fixed-layout'
export type { SingleProductLayoutProps } from './single-product-layout'