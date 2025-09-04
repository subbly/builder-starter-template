import { Bundle, BundleGroupsResponse } from '@subbly/react'
import { subblyApi } from '@/lib/subbly'
import { useQuery } from '@tanstack/react-query'

type BundleGroupsQueryProps = {
  queryId?: string
  bundleId: Bundle['id']
}

const DEFAULT_QUERY_ID = 'bundle_groups_list'

export const getBundleGroupsQueryOptions = (props: BundleGroupsQueryProps) => {
  return {
    queryKey: [props.queryId || DEFAULT_QUERY_ID, props.bundleId],
    queryFn: async () => {
      return subblyApi.bundle.listGroups(props.bundleId)
    }
  }
}

export const useBundleGroupsQuery = (props: BundleGroupsQueryProps) => {
  return useQuery<BundleGroupsResponse>(getBundleGroupsQueryOptions(props))
}