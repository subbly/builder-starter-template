import { PropsWithChildren } from 'react'
import { ViewTransition } from 'react'

export function TransitionRouterProvider({ children }: PropsWithChildren) {
  return <ViewTransition>{children}</ViewTransition>
}
