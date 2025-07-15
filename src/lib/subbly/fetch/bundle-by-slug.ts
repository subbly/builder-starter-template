import { subbly } from '@/lib/subbly'
import { Bundle, BundleHeaders } from '../types'
import { bundleTransformer } from '@/lib/subbly/transformers'

export const bundleBySlug = async (slug: string, headers?: BundleHeaders): Promise<Bundle | null> => {
  const bundle = await subbly.bundleBySlug(slug, headers)

  return bundle ? bundleTransformer(bundle) : null
}