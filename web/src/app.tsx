import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { queryClient } from './lib/query-client'
import { HomePage } from './pages/home'
import { NotFoundPage } from './pages/not-found'
import { RedirectPage } from './pages/redirect'

const router = createBrowserRouter([
  { path: '/', element: <HomePage /> },
  { path: '/url/not-found', element: <NotFoundPage /> },
  { path: '/:shortCode', element: <RedirectPage /> },
  { path: '*', element: <NotFoundPage /> },
])

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
