import { useQuery } from '@tanstack/react-query'
import type { Bundle, BundleItemsParams, BundleItemsResponse } from '@subbly/api-client'
import { subblyApi } from '../index'

type BundleItemsQueryProps = {
  queryId?: string
  bundleId: Bundle['id']
  filters: BundleItemsParams
}

const DEFAULT_QUERY_ID = 'bundle_items_list'

export const getBundleItemsQueryOptions = (props: BundleItemsQueryProps) => {
  return {
    queryKey: [props.queryId || DEFAULT_QUERY_ID, props.bundleId, props.filters],
    queryFn: async () => {
      return subblyApi.bundle.listItems(props.bundleId, props.filters)
    },
  }
}

export const useBundleItemsQuery = (props: BundleItemsQueryProps) => {
  return useQuery<BundleItemsResponse>(getBundleItemsQueryOptions(props))
}
