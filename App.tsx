import React, { useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import MobileTabBar from './components/MobileTabBar';
import { AppHeader } from './components/layout/AppHeader';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { AppFooter } from './components/layout/AppFooter';
import { CookieConsent } from './components/ui/CookieConsent';
import { usePageTitle } from './hooks/usePageTitle';
import Dashboard from './views/Dashboard';

// Lazy-loaded views – each gets its own chunk, loaded on demand
const SubscriptionFlow = React.lazy(() => import('./views/SubscriptionFlow'));
const CourseFlow = React.lazy(() => import('./views/CourseFlow'));
const GuidesView = React.lazy(() => import('./views/GuidesView'));
const SimulatorView = React.lazy(() => import('./views/SimulatorView'));
const RadarView = React.lazy(() => import('./views/RadarView'));
const FaqView = React.lazy(() => import('./views/FaqView'));
const TermsView = React.lazy(() => import('./views/TermsView'));
const PrivacyView = React.lazy(() => import('./views/PrivacyView'));
const NotFound = React.lazy(() => import('./views/NotFound'));

import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { PwaPrompt } from './components/ui/PwaPrompt';
import { ToastContainer } from './components/ui/ToastContainer';
import { useAppContext } from './context/AppContext';
const Analytics = React.lazy(() => import('@vercel/analytics/react').then(m => ({ default: m.Analytics })));
const SpeedInsights = React.lazy(() => import('@vercel/speed-insights/react').then(m => ({ default: m.SpeedInsights })));
const LegalBot = React.lazy(() => import('./components/ui/LegalBot').then(m => ({ default: m.LegalBot })));

export default function App() {
  const location = useLocation();
  const { toasts, removeToast } = useAppContext();

  // Dynamic page title
  usePageTitle(location.pathname);

  // Scroll to top on route change — use View Transitions API for smooth transitions
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  return (
    <div className="min-h-[100dvh] relative text-slate-100 overflow-x-hidden z-0">
      {/* Static abstract ambient gradients — extracted to CSS for GPU layer reuse */}
      <div 
          className="fixed inset-0 w-full h-full pointer-events-none -z-10 app-ambient-bg" 
          aria-hidden="true"
      />

      <AppHeader />

      {/* Mobile Tab Bar */}
      <MobileTabBar />

      {/* PWA Update Prompt */}
      <PwaPrompt />

      {/* Global Toast Notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <Suspense fallback={null}><Analytics /><SpeedInsights /></Suspense>
      <Suspense fallback={null}><LegalBot /></Suspense>

      <ErrorBoundary>
        <div id="main" role="main" className="relative z-10 w-full max-w-6xl mx-auto min-h-[100dvh] pt-[max(1rem,env(safe-area-inset-top))] md:pt-32 pb-28 md:pb-24">
          <div className="h-full w-full view-enter">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/claim" element={<ErrorBoundary><SubscriptionFlow /></ErrorBoundary>} />
                <Route path="/claim/:service" element={<ErrorBoundary><SubscriptionFlow /></ErrorBoundary>} />
                <Route path="/course" element={<ErrorBoundary><CourseFlow /></ErrorBoundary>} />
                <Route path="/course/:service" element={<ErrorBoundary><CourseFlow /></ErrorBoundary>} />
                <Route path="/guides" element={<ErrorBoundary><GuidesView /></ErrorBoundary>} />
                <Route path="/guides/:id" element={<ErrorBoundary><GuidesView /></ErrorBoundary>} />
                <Route path="/simulator" element={<ErrorBoundary><SimulatorView /></ErrorBoundary>} />
                <Route path="/radar" element={<ErrorBoundary><RadarView /></ErrorBoundary>} />
                <Route path="/faq" element={<ErrorBoundary><FaqView /></ErrorBoundary>} />
                <Route path="/terms" element={<ErrorBoundary><TermsView /></ErrorBoundary>} />
                <Route path="/privacy" element={<ErrorBoundary><PrivacyView /></ErrorBoundary>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </ErrorBoundary>

      {/* Global Footer — legal links & copyright */}
      <AppFooter />

      {/* Cookie Banner */}
      <CookieConsent />
    </div>
  );
}