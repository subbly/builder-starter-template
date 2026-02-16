import { client } from '../lib/client.js';

const bundleId = Number(process.argv[2]);
if (!bundleId) { console.error('Usage: node scripts/list-bundle-items.js <bundleId>'); process.exit(1); }

const result = await client.bundles.listItems({ bundleId, expand: ['variant.metadata'] });
console.log(JSON.stringify(result, null, 2));
