import { client } from '../../lib/client.js';

let input = process.argv[2];

if (!input) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  input = Buffer.concat(chunks).toString();
}

const params = input ? JSON.parse(input) : {};
const result = await client.tags.list({
  perPage: 50,
  sort: { field: 'id', direction: 'desc' },
  ...params,
});

console.log(JSON.stringify(result, null, 2));
