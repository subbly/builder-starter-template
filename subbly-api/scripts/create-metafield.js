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
  console.error('Usage: node scripts/create-metafield.js \'<json>\' or pipe JSON via stdin');
  console.error('Required: name, dataType, accessLevel (storefront|private)');
  console.error('dataTypes: single_line_string, multi_line_text, rich_text, integer, decimal,');
  console.error('           datetime, date, time, volume, weight, boolean, color, rating, url, money, json');
  process.exit(1);
}

const params = JSON.parse(input);
const result = await client.metafields.create(params);
console.log(JSON.stringify(result, null, 2));
