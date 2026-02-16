import { client } from '../lib/client.js';

const result = await client.bundles.list({
  perPage: 10,
  sort: { field: 'id', direction: 'desc' },
  expand: ['metadata', 'filters', 'preferences', 'plans.variant', 'plans.plan', 'rulesets'],
});

console.log(JSON.stringify(result, null, 2));
