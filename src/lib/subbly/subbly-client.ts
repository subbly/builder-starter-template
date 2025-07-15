import type {
  BundleListParams,
  BundleListResponse,
  Bundle,
  ParentProduct,
  Product,
  ProductsListParams,
  ProductsListResponse,
  SubblyApiClient,
  BundleGroupsResponse,
  BundleRequestHeaders,
  ProductRequestHeaders,
} from '@subbly/api-client'

type SubblyClientProps = {
  client: SubblyApiClient
}

export class SubblyClient {
  _client: SubblyApiClient

  constructor(props: SubblyClientProps) {
    this._client = props.client
  }

  get client() {
    return this._client
  }

  async productById(id: ParentProduct['id'], headers?: ProductRequestHeaders): Promise<ParentProduct> {
    return this._client.products.load(id, {
      expand: ['variants', 'pricings'],
    }, headers)
  }

  async productBySlug(slug: ParentProduct['slug'], headers?: ProductRequestHeaders): Promise<ParentProduct | null> {
    const { data } = await this._client.products.list({
      slugs: [slug],
      perPage: 1,
      expand: ['variants', 'pricings'],
    }, headers)

    return data[0] || null
  }

  async variantById(id: Product['id'], headers?: ProductRequestHeaders): Promise<Product> {
    return this._client.products.loadVariant(id, {
      expand: ['parent'],
    }, headers)
  }

  async listProducts(params: ProductsListParams, headers?: ProductRequestHeaders): Promise<ProductsListResponse> {
    return this._client.products.list({
      ...(params || {}),
      expand: ['variants', 'pricings'],
    }, headers)
  }

  async listBundles(params: Omit<BundleListParams, 'expand'>, headers?: BundleRequestHeaders): Promise<BundleListResponse> {
    return this._client.bundle.list({
      ...(params || {}),
      expand: ['plans.variant', 'plans.pricing'],
    }, headers)
  }

  async bundleById(id: number, headers?: BundleRequestHeaders): Promise<Bundle> {
    return this._client.bundle.load(id, {
      expand: ['plans.variant', 'plans.pricing'],
    }, headers)
  }

  async bundleBySlug(slug: string, headers?: BundleRequestHeaders): Promise<Bundle | null> {
    const { data } = await this._client.bundle.list({
      slugs: [slug],
      perPage: 1,
      expand: ['plans.variant', 'plans.pricing'],
    }, headers)

    return data[0] || null
  }

  async loadBundleGroups(bundleId: number, headers?: BundleRequestHeaders): Promise<BundleGroupsResponse> {
    const group = await this._client.bundle.loadGroups(bundleId, {
      expand: ['product', 'items.product.parent'],
    }, headers)
    
    return group
  }
}
