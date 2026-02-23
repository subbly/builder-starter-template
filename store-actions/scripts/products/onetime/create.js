import { client } from '../../../lib/client.js';

// Usage: node scripts/create-onetime-product.js '{"name":"My Product","slug":"my-product","digital":0}'
// Or pipe JSON via stdin

let input = process.argv[2];

if (!input) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  input = Buffer.concat(chunks).toString();
}

if (!input) {
  console.error('No input provided. Run: node scripts/get-types.js products.createOneTime');
  process.exit(1);
}

const params = JSON.parse(input);
const result = await client.products.oneTime.create(params);
console.log(JSON.stringify(result, null, 2));