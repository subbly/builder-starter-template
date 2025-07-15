import { subbly } from '@/lib/subbly'
import { Bundle, BundleHeaders } from '../types'
import { bundleTransformer } from '@/lib/subbly/transformers'

export const bundleById = async (id: number, headers?: BundleHeaders): Promise<Bundle> => {
  const bundle = await subbly.bundleById(id, headers)

  return bundleTransformer(bundle)
}