import { client } from '../../lib/client.js';

const result = await client.tags.list({
  perPage: 50,
  sort: { field: 'id', direction: 'desc' },
});

console.log(JSON.stringify(result, null, 2));
