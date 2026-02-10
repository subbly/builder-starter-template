import { client } from '../lib/client.js';

const id = Number(process.argv[2]);
if (!id) { console.error('Usage: node scripts/get-product.js <id>'); process.exit(1); }

const result = await client.products.get({ id });
console.log(JSON.stringify(result, null, 2));
