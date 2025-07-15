import { SubblyClient } from './subbly-client'
import { SubblyApiClient } from '@subbly/api-client'

export { SubblyScript } from './subbly-script'

if (!process.env.NEXT_PUBLIC_SUBBLY_API_KEY) {
  throw new Error('Subbly API key not found. Please add it to the .env file.')
}

export const client = SubblyApiClient.init({
  apiKey: process.env.NEXT_PUBLIC_SUBBLY_API_KEY as string,
})

export const subbly = new SubblyClient({
  client,
})
