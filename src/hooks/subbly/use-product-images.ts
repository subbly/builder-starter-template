import { useMemo } from 'react'
import { orderBy } from 'lodash-es'
import { ProductImage } from '@/lib/subbly/types'

type UseProductGalleryProps = {
  images: ProductImage[]
}

export const useProductGallery = (props: UseProductGalleryProps) => {
  const images = useMemo(() => {
    return orderBy(props.images, ['order'], ['asc'])
  }, [props.images])

  const firstImage = images[0] || null

  return {
    images,
    firstImage,
  }
}