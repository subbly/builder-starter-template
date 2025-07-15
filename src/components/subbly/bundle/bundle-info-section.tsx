import type { HTMLProps } from 'react'
import { Bundle, BundleGroup } from '@/lib/subbly/types'
import { BundleGroupForm } from './bundle-group-form'
import { AddToCartButton } from '../add-to-cart-button'

export type BundleInfoSectionProps = HTMLProps<HTMLDivElement> & {
  bundle: Bundle
  groups: BundleGroup[]
}

export const BundleInfoSection = (props: BundleInfoSectionProps) => {
  const bundle = props.bundle
  const description = bundle.description

  return (
    <div className={props.className}>
      <div className="mb-6">
        <div className="mb-4 flex flex-col items-start gap-1">
          <h1 className="mb-2">{bundle.name}</h1>
        </div>

        {description && (
          <div
            className="main-typography"
            dangerouslySetInnerHTML={{
              __html: description,
            }}
          />
        )}
      </div>

      {props.groups.length > 0 ? (
        <BundleGroupForm bundle={bundle} groups={props.groups} />
      ) : (
        <AddToCartButton
          payload={{
            productId: bundle.plans[0].plan?.id,
            bundleId: bundle.id,
            quantity: 1,
          }}
        >
          <span className="capitalize">Add to cart</span>
        </AddToCartButton>
      )}
    </div>
  )
}
