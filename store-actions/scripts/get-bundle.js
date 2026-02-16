import { client } from '../lib/client.js';

const id = Number(process.argv[2]);
if (!id) { console.error('Usage: node scripts/get-bundle.js <id>'); process.exit(1); }

const result = await client.bundles.get({ id, expand: ['metadata', 'filters', 'preferences', 'plans.variant', 'plans.plan', 'rulesets'] });
console.log(JSON.stringify(result, null, 2));
