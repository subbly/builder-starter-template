'use client'

import { Button } from '@/components/ui/button'
import { PropsWithChildren } from 'react'
import { useSubblyCart } from '@subbly/react'
import type { ConfigureItemPayload } from '@subbly/react'

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
