import { BundleGroup, BundleItem } from "@/lib/subbly/types";

export type SelectedBundleItem = {
  item: BundleItem
  quantity: number
}

export type ProductForm = {
  productId: number
  quantity: number
}

export type BundleForm = {
  productId: number
  quantity: number
  items: Record<BundleGroup["id"], SelectedBundleItem>
}

export type PriceCalculateFn = (price: number) => number

export type PlanPriceCalculatorMap = Map<number, PriceCalculateFn>