import { client } from '../../lib/client.js';

let input = process.argv[2];

if (!input) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  input = Buffer.concat(chunks).toString();
}

const params = input ? JSON.parse(input) : {};
const result = await client.products.list({
  perPage: 10,
  sort: { field: 'id', direction: 'desc' },
  expand: ['plans', 'variants', 'metadata'],
  ...params,
});

console.log(JSON.stringify(result, null, 2));
