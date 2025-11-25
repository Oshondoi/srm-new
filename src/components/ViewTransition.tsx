'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, ReactNode } from 'react'

interface ViewTransitionProps {
  children: ReactNode
}

export default function ViewTransition({ children }: ViewTransitionProps) {
  const pathname = usePathname()
  const prevPathRef = useRef(pathname)

  useEffect(() => {
    // Если путь изменился и браузер поддерживает View Transitions
    if (prevPathRef.current !== pathname) {
      if (document.startViewTransition) {
        document.startViewTransition(() => {
          prevPathRef.current = pathname
        })
      } else {
        prevPathRef.current = pathname
      }
    }
  }, [pathname])

  return <>{children}</>
}
