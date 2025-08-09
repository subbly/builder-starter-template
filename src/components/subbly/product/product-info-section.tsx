import type { HTMLProps } from 'react'
import type { ParentProduct } from '@subbly/react'
import { ProductForm } from './product-form'

export type ProductInfoSectionProps = HTMLProps<HTMLDivElement> & {
  product: ParentProduct
}

export const ProductInfoSection = (props: ProductInfoSectionProps) => {
  const product = props.product
  const description = product.description

  return (
    <div className={props.className}>
      <div className="mb-6">
        <div className="mb-4 flex flex-col items-start gap-1">
          <h1 className="mb-2">{product.name}</h1>
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

      <ProductForm
        product={product}
      />
    </div>
  )
}
