import { client } from '../../lib/client.js';

const bundleId = Number(process.argv[2]);
const itemId = Number(process.argv[3]);
if (!bundleId || !itemId) { console.error('Usage: node scripts/get-bundle-item.js <bundleId> <itemId>'); process.exit(1); }

const result = await client.bundles.getItem({ bundleId, itemId, expand: ['variant.metadata'] });
console.log(JSON.stringify(result, null, 2));
