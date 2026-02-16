import { toJSONSchema } from 'zod';
import * as api from '@subbly/private-api-client';

const RESOURCES = {
  products: {
    list: api.ListProductsParamsSchema,
    get: api.GetProductParamsSchema,
    getVariant: api.GetVariantParamsSchema,
    getPlan: api.GetPlanParamsSchema,
  },
  bundles: {
    list: api.ListBundlesParamsSchema,
    get: api.GetBundleParamsSchema,
    listItems: api.ListBundleItemsParamsSchema,
    getItem: api.GetBundleItemParamsSchema,
    listGroups: api.ListBundleGroupsParamsSchema,
  },
  tags: {
    list: api.ListTagsParamsSchema,
  },
  surveys: {
    get: api.GetSurveyParamsSchema,
  },
  metafields: {
    list: api.ListMetafieldParamsSchema,
    create: api.CreateMetafieldParamsSchema,
    update: api.UpdateMetafieldParamsSchema,
  },
};

const arg = process.argv[2];

if (!arg) {
  const available = Object.entries(RESOURCES).flatMap(([r, methods]) =>
    Object.keys(methods).map((m) => `${r}.${m}`)
  );
  console.error('Usage: node get-types.js <resource[.method]>');
  console.error(`Available: ${available.join(', ')}`);
  process.exit(1);
}

const [resource, method] = arg.split('.');

if (!RESOURCES[resource]) {
  console.error(`Unknown resource: ${resource}`);
  console.error(`Available: ${Object.keys(RESOURCES).join(', ')}`);
  process.exit(1);
}

if (method && !RESOURCES[resource][method]) {
  console.error(`Unknown method: ${resource}.${method}`);
  console.error(`Available: ${Object.keys(RESOURCES[resource]).map((m) => `${resource}.${m}`).join(', ')}`);
  process.exit(1);
}

const schemas = method
  ? { [method]: RESOURCES[resource][method] }
  : RESOURCES[resource];

const output = {};
for (const [name, schema] of Object.entries(schemas)) {
  try {
    output[name] = toJSONSchema(schema);
  } catch {
    output[name] = { error: 'Could not convert to JSON Schema' };
  }
}

console.log(JSON.stringify(method ? output[method] : output, null, 2));
