import { client } from '../../../lib/client.js';

// Usage: node scripts/update-variant.js '{"id":1,"price":12.99}'
// Or pipe JSON via stdin

let input = process.argv[2];

if (!input) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  input = Buffer.concat(chunks).toString();
}

if (!input) {
  console.error('No input provided. Run: node scripts/get-types.js products.updateVariant');
  process.exit(1);
}

const params = JSON.parse(input);
const result = await client.products.variants.update(params);
console.log(JSON.stringify(result, null, 2));
