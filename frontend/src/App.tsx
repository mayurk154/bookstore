import { AppRouter } from './router';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider, ToastViewport } from './components/ui/toast';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppRouter />
        <ToastViewport />
      </ToastProvider>
    </ErrorBoundary>
  );
}
