import { client } from '../../../lib/client.js';

// Usage: node scripts/products/subscription/metadata.js '{"id":1,"metadata":{"create":[{"name":"color","values":["red"]}]}}'
// Or pipe JSON via stdin

let input = process.argv[2];

if (!input) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  input = Buffer.concat(chunks).toString();
}

if (!input) {
  console.error('No input provided. Run: node scripts/get-types.js products.metadata');
  process.exit(1);
}

const params = JSON.parse(input);
const result = await client.products.subscription.metadata(params);
console.log(JSON.stringify(result, null, 2));