# Variant Batch Response

Return type for `products.variants.batch` (`VariantBatchResponse`).

```ts
interface VariantBatchResponse {
  create: Variant[];
  update: Variant[];
  delete: Variant[];
}
```

All three keys are always present. Each returns full `Variant` entities — including `delete`, which returns the archived variants in their final state.

See `response.md` for the `Variant` interface.
