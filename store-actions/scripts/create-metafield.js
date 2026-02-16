import { client } from '../lib/client.js';

// Usage: echo '{"name":"My Field","dataType":"single_line_string","accessLevel":"storefront"}' | node scripts/create-metafield.js
// Or pass inline: node scripts/create-metafield.js '{"name":"My Field","dataType":"single_line_string","accessLevel":"storefront"}'

let input = process.argv[2];

if (!input) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  input = Buffer.concat(chunks).toString();
}

if (!input) {
  console.error('No input provided. See references/params/metafields-create-params.json for input schema.');
  process.exit(1);
}

const params = JSON.parse(input);
const result = await client.metafields.create(params);
console.log(JSON.stringify(result, null, 2));
