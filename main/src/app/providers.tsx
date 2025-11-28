'use client'

import { PropsWithChildren, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SubblyProvider } from '@subbly/react'

export const Providers = ({ children }: PropsWithChildren) => {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <SubblyProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </SubblyProvider>
  )
}
