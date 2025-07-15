import { subbly } from '@/lib/subbly'
import { Product, ProductHeaders } from '../types'
import { productTransformer } from '@/lib/subbly/transformers'

export const productById = async (id: number, headers?: ProductHeaders): Promise<Product> => {
  const product = await subbly.productById(id, headers)

  return productTransformer(product)
}