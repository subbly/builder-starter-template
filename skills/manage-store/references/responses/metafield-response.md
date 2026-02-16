# Metafield Response

Return type for `metafields.list` (`PaginatedResponse<Metafield>`), `metafields.create` (`Metafield`), `metafields.update` (`Metafield`).

```ts
interface Metafield {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  unit?: string | null;
  dataType: 'single_line_string' | 'multi_line_text' | 'rich_text' | 'integer' | 'decimal' | 'datetime' | 'date' | 'time' | 'volume' | 'weight' | 'boolean' | 'color' | 'rating' | 'url' | 'money' | 'json';
  preset: boolean;
  multiple: boolean;
  accessLevel: 'storefront' | 'private';
  values?: MetafieldValue[];
}

interface MetafieldValue {
  id: number;
  value: string | number | boolean | Record<string, unknown>;
}
```

## Metadata (nested inside other responses)

When metafields appear nested inside products, variants, or plans, they use the `Metadata` shape:

```ts
interface Metadata {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  unit?: string | null;
  dataType: 'single_line_string' | 'multi_line_text' | 'rich_text' | 'integer' | 'decimal' | 'datetime' | 'date' | 'time' | 'volume' | 'weight' | 'boolean' | 'color' | 'rating' | 'url' | 'money' | 'json';
  preset: boolean;
  multiple: boolean;
  accessLevel: 'storefront' | 'private';
  values?: MetadataValue[];
}

interface MetadataValue {
  id: number;
  valueId: number;
  value: string | number | boolean | Record<string, unknown>;
  metadata?: Array<'image_url' | 'color'> | null;
}
```
