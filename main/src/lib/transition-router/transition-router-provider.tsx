'use client'

import { PropsWithChildren, useRef } from 'react'
import { TransitionRouter } from 'next-transition-router'
import { animate } from 'motion'

export function TransitionRouterProvider(props: PropsWithChildren) {
  const wrapperRef = useRef<HTMLDivElement>(null!)
  return (
    <TransitionRouter
      auto
      leave={(next) => {
        animate(
          wrapperRef.current,
          { opacity: [1, 0] },
          { duration: 0.25, ease: 'easeInOut', onComplete: next }
        )
      }}
      enter={(next) => {
        animate(
          wrapperRef.current,
          { opacity: [0, 1] },
          { duration: 0.25, ease: 'easeInOut', onComplete: next }
        )
      }}
    >
      <div ref={wrapperRef}>{props.children}</div>
    </TransitionRouter>
  )
}
