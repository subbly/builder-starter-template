import { client } from '../../../lib/client.js';

const id = Number(process.argv[2]);
if (!id) { console.error('Usage: node scripts/archive-subscription-product.js <id>'); process.exit(1); }

const result = await client.products.subscription.archive({ id });
console.log(JSON.stringify(result, null, 2));