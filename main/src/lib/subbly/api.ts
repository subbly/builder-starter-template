import { subblyApi } from '@subbly/react'

if (!process.env.NEXT_PUBLIC_SUBBLY_API_KEY) {
  throw new Error('Subbly API key not found. Please add it to the .env file.')
}

subblyApi.initialize({
  apiKey: process.env.NEXT_PUBLIC_SUBBLY_API_KEY as string
})

export {
  subblyApi
}