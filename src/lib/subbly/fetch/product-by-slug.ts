import { subbly } from '@/lib/subbly'
import { Product, ProductHeaders } from '../types'
import { productTransformer } from '@/lib/subbly/transformers'

export const productBySlug = async (slug: string, headers?: ProductHeaders): Promise<Product | null> => {
  const product = await subbly.productBySlug(slug, headers)

  return product ? productTransformer(product) : null
}