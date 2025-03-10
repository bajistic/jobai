'use client'

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { config } from '@/lib/config'

export default function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!config.googleAnalyticsId) return
    
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '')
    
    // Send pageview with path
    window.gtag?.('config', config.googleAnalyticsId, {
      page_path: url,
    })
  }, [pathname, searchParams])

  if (!config.googleAnalyticsId) {
    return null
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${config.googleAnalyticsId}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
    </>
  )
}