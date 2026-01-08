'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { trackPageView } from '@/lib/sessionTracking'

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    trackPageView(pathname, document.title)
  }, [pathname])

  return <>{children}</>
}

