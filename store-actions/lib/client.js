import 'dotenv/config';
import { PrivateSubblyClient } from '@subbly/private-api-client';

const apiKey = process.env.SUBBLY_API_KEY;
const apiUrl = process.env.SUBBLY_API_URL;

if (!apiKey) {
  console.error('Error: Set SUBBLY_API_KEY in store-actions/.env');
  process.exit(1);
}

export const client = apiUrl
  ? new PrivateSubblyClient(apiKey, apiUrl)
  : new PrivateSubblyClient(apiKey);
