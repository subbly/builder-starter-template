'use client'

import { PropsWithChildren, useSyncExternalStore } from 'react'
import { ViewTransition } from 'react'

function subscribe(onChange: () => void) {
  document.addEventListener('visibilitychange', onChange)
  return () => document.removeEventListener('visibilitychange', onChange)
}

function getSnapshot() {
  return document.visibilityState === 'visible'
}

function getServerSnapshot() {
  return true
}

export function TransitionRouterProvider({ children }: PropsWithChildren) {
  const isVisible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  return <ViewTransition default={isVisible ? undefined : 'none'}>{children}</ViewTransition>
}
