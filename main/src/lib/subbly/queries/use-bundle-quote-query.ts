import { useQuery } from '@tanstack/react-query'
import type { Bundle, BundleQuote, BundleQuotePayload } from '@subbly/react'
import { subblyApi } from '@/lib/subbly/api'

type BundleQuoteQueryProps = {
  queryId?: string
  bundleId: Bundle['id']
  payload: BundleQuotePayload
}

const DEFAULT_QUERY_ID = 'bundle_quote'

export const getBundleQuoteQueryOptions = (props: BundleQuoteQueryProps) => {
  return {
    queryKey: [props.queryId || DEFAULT_QUERY_ID, props.bundleId, props.payload],
    queryFn: async () => {
      return subblyApi.bundle.quote(props.bundleId, props.payload)
    }
  }
}
export const useBundleQuoteQuery = (props: BundleQuoteQueryProps) => {
  return useQuery<BundleQuote>(getBundleQuoteQueryOptions(props))
}