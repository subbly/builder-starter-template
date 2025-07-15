import { subbly } from '@/lib/subbly'
import { ListProductsFilters, ProductList, ProductHeaders } from '../types'
import { productTransformer } from '@/lib/subbly/transformers'
import { ProductsListParams } from '@subbly/api-client'

export const listProducts = async (params: ListProductsFilters, headers?: ProductHeaders): Promise<ProductList> => {
  const { data, pagination } = await subbly.listProducts({
    page: params.page,
    perPage: params.perPage,
    tags: params.tags,
    type: params.type,
    slugs: params.slugs,
    digital: params.digital,
    giftCard: params.giftCard,
  } as ProductsListParams, headers)

  return {
    data: data.map((product) => productTransformer(product)),
    pagination: pagination,
  }
}
