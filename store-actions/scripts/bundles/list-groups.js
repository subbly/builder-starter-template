import { client } from '../../lib/client.js';

// Usage: node scripts/bundles/list-groups.js '{"bundleId":123}'
// Or pipe JSON via stdin

let input = process.argv[2];

if (!input) {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  input = Buffer.concat(chunks).toString();
}

if (!input) {
  console.error('No input provided.');
  process.exit(1);
}

const params = JSON.parse(input);
const result = await client.bundles.listGroups({ expand: ['items.variant.metadata'], ...params });
console.log(JSON.stringify(result, null, 2));
