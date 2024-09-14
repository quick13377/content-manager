import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { Navigation } from '@/components/Navigation'
import ErrorBoundary from '@/components/ErrorBoundary'
import { Toaster } from "@/components/ui/toast"

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Navigation />
      <Component {...pageProps} />
      <Toaster />
    </ErrorBoundary>
  )
}

export default MyApp