import { subbly } from '@/lib/subbly'
import { ListBundlesFilters, BundleList, BundleHeaders } from '../types'
import { bundleTransformer } from '@/lib/subbly/transformers'
import type { BundleListParams } from '@subbly/api-client'

export const listBundles = async (params: ListBundlesFilters, headers?: BundleHeaders): Promise<BundleList> => {
  const { data, pagination } = await subbly.listBundles({
    page: params.page,
    perPage: params.perPage,
    tags: params.tags,
    slugs: params.slugs,
    ids: params.ids,
    digital: params.digital,
    configurable: params.configurable,
  } as BundleListParams, headers)

  return {
    data: data.map((bundle) => bundleTransformer(bundle)),
    pagination: pagination,
  }
}
