import { client } from '../lib/client.js';

const bundleId = Number(process.argv[2]);
if (!bundleId) { console.error('Usage: node scripts/list-bundle-groups.js <bundleId>'); process.exit(1); }

const result = await client.bundles.listGroups({ bundleId, expand: ['items.variant.metadata'] });

console.log(JSON.stringify(result, null, 2));
