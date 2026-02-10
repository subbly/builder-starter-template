import { client } from '../lib/client.js';

const result = await client.products.list({
  perPage: 10,
  sort: { field: 'id', direction: 'desc' },
});

console.log(JSON.stringify(result, null, 2));
