'use client'

import { useCallback, useState, useEffect, type HTMLProps } from 'react'
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useProductGallery } from '@/hooks/subbly/use-product-images'
import { ProductImage } from '@/lib/subbly/types'

export type ProductGallerySectionProps = HTMLProps<HTMLDivElement> & {
  images: ProductImage[]
  productName: string
}

export const ProductGallerySection = (props: ProductGallerySectionProps) => {
  const { images } = useProductGallery({ images: props.images })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaMainApi, setEmblaMainApi] = useState<CarouselApi>()

  const hasSingleSlide = images.length === 1

  const onThumbnailClick = useCallback(
    (index: number) => {
      if (!emblaMainApi) {
        return
      }

      emblaMainApi.scrollTo(index)
    },
    [emblaMainApi]
  )

  const onSelect = useCallback(() => {
    if (!emblaMainApi) {
      return
    }
    setSelectedIndex(emblaMainApi.selectedScrollSnap())
  }, [emblaMainApi, setSelectedIndex])

  useEffect(() => {
    if (!emblaMainApi) {
      return
    }
    onSelect()

    emblaMainApi.on('select', onSelect).on('reInit', onSelect)
  }, [emblaMainApi, onSelect])
  return (
    <div className={props.className}>
      {hasSingleSlide ? (
        <div>
          <Image
            src={images[0].url}
            priority
            alt={`${props.productName} photo 1`}
            className="w-full h-full object-cover overflow-hidden"
            width={1000}
            height={1300}
          />
        </div>
      ) : (
        <>
          <Carousel
            opts={{
              loop: true,
            }}
            setApi={setEmblaMainApi}
          >
            <CarouselContent>
              {images.map((image: ProductImage, index: number) => (
                <CarouselItem key={image.id} className="w-full h-full">
                  <Image
                    src={image.url}
                    priority={index === 0}
                    alt={`${props.productName} photo ${image.order}`}
                    className="w-full h-full object-cover overflow-hidden"
                    width={1000}
                    height={1300}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {!hasSingleSlide && (
            <>
              <div className="mt-2 flex gap-2 flex-wrap justify-center">
                {images.map((image: ProductImage, index: number) => (
                  <button
                    key={index}
                    className={cn(
                      'transition-all w-16 h-16 overflow-hidden border-2 border-transparent overflow-hidden',
                      selectedIndex === index ? 'border-brown-600' : ''
                    )}
                    onClick={() => onThumbnailClick(index)}
                  >
                    <Image
                      src={image.url}
                      alt="Image"
                      className="w-full h-full object-cover"
                      width={52}
                      height={52}
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
