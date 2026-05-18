import { TooltipProvider } from '@/components/ui/tooltip'
import { AppRouter } from '@/app/router'
import { ErrorBoundary } from '@/ui/ErrorBoundary'
import { ToastContainer } from '@/ui/layout/ToastContainer'

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={300}>
        <AppRouter />
        <ToastContainer />
      </TooltipProvider>
    </ErrorBoundary>
  )
}

export default App
