import { client } from '../lib/client.js';

const id = Number(process.argv[2]);
if (!id) { console.error('Usage: node scripts/get-survey.js <id>'); process.exit(1); }

const result = await client.surveys.get({ id });
console.log(JSON.stringify(result, null, 2));
