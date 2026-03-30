import { lazy, Suspense } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { isSupabaseConfigured } from './lib/supabase'
import { ConfigMissing } from './components/ConfigMissing'
import { PageLoader } from './components/ui/LoadingSpinner'

const AppRoutes = lazy(() => import('./AppRoutes'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export default function App() {
  if (!isSupabaseConfigured) {
    return <ConfigMissing />
  }

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<PageLoader />}>
        <AppRoutes />
      </Suspense>
    </QueryClientProvider>
  )
}
