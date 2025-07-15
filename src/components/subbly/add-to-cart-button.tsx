'use client'

import { Button } from '@/components/ui/button'
import { PropsWithChildren } from 'react'
import { useSubblyCart } from '@/lib/subbly/use-subbly-cart'
import { ConfigureItemPayload } from '@/lib/subbly/types'

export type AddToCartButtonProps = PropsWithChildren<{
  payload: ConfigureItemPayload
}>

export const AddToCartButton = (props: AddToCartButtonProps) => {
  const { addToCart } = useSubblyCart()

  const onAddToCart = () => {
    addToCart(props.payload)
  }

  return (
    <Button className="h-10 w-full" onClick={() => onAddToCart()}>
      {props.children || <span className="capitalize">Add to cart</span>}
    </Button>
  )
}
