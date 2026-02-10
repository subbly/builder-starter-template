import { client } from '../lib/client.js';

const result = await client.bundles.list({
  perPage: 10,
  sort: { field: 'id', direction: 'desc' },
});

console.log(JSON.stringify(result, null, 2));
