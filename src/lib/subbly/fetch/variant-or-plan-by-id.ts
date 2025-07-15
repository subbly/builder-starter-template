import { subbly } from '@/lib/subbly'
import { ProductPlan, ProductVariant, ProductHeaders } from '../types'
import { variantOrPlanTransformer } from '@/lib/subbly/transformers'

export const variantOrPlanById = async (id: number, headers?: ProductHeaders): Promise<ProductVariant | ProductPlan> => {
  const variant = await subbly.variantById(id, headers)

  return variantOrPlanTransformer(variant)
}
