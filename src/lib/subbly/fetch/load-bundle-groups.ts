import { subbly } from '@/lib/subbly'
import { BundleGroupList, BundleHeaders } from '../types'
import { bundleGroupTransformer } from '@/lib/subbly/transformers'

export const loadBundleGroups = async (bundleId: number, headers?: BundleHeaders): Promise<BundleGroupList> => {
  const { data, pagination } = await subbly.loadBundleGroups(bundleId, headers)

  return {
    data: data.map((group) => bundleGroupTransformer(group)),
    pagination,
  }
}