import 'dotenv/config';
import { PrivateSubblyClient } from '@subbly/private-api-client';

const apiKey = process.env.SUBBLY_API_KEY;
const apiUrl = process.env.SUBBLY_API_URL;

if (!apiKey || apiKey === 'your-api-key-here') {
  console.error('Error: Set SUBBLY_API_KEY in store-actions/.env');
  process.exit(1);
}

if (!apiUrl) {
  console.error('Error: Set SUBBLY_API_URL in store-actions/.env');
  process.exit(1);
}

export const client = new PrivateSubblyClient(apiKey, apiUrl);
