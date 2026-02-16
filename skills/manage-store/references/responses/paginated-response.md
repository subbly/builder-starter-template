# Paginated Response

Wrapper type for all list methods (`products.list`, `bundles.list`, `tags.list`, etc.).

```ts
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    lastPage: number | null;
    total: number;
    from: number | null;
    to: number | null;
    perPage?: number;
  };
}
```
