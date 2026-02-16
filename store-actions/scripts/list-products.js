import { client } from '../lib/client.js';

const result = await client.products.list({
  perPage: 10,
  sort: { field: 'id', direction: 'desc' },
  expand: ['plans', 'variants', 'metadata'],
});

console.log(JSON.stringify(result, null, 2));
