import React, { useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import MobileTabBar from './components/MobileTabBar';
import { AppHeader } from './components/layout/AppHeader';
import { ErrorBoundary } from './components/layout/ErrorBoundary';
import { usePageTitle } from './hooks/usePageTitle';
import Dashboard from './views/Dashboard';

// Lazy-loaded views — each gets its own chunk, loaded on demand
const SubscriptionFlow = React.lazy(() => import('./views/SubscriptionFlow'));
const CourseFlow = React.lazy(() => import('./views/CourseFlow'));
const GuidesView = React.lazy(() => import('./views/GuidesView'));
const SimulatorView = React.lazy(() => import('./views/SimulatorView'));
const RadarView = React.lazy(() => import('./views/RadarView'));
const FaqView = React.lazy(() => import('./views/FaqView'));
const NotFound = React.lazy(() => import('./views/NotFound'));

import { LoadingSpinner } from './components/ui/LoadingSpinner';

export default function App() {
  const location = useLocation();

  // Dynamic page title
  usePageTitle(location.pathname);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  return (
    <div className="min-h-screen relative text-slate-100 overflow-x-hidden">
      {/* VisionOS Animated Mesh Gradient Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 bg-app-bg">
        <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-accent-purple/15 blur-[120px] mix-blend-screen animate-blob transform-gpu"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-accent-blue/15 blur-[120px] mix-blend-screen animate-blob transform-gpu" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-accent-cyan/10 blur-[140px] mix-blend-screen animate-blob transform-gpu" style={{ animationDelay: '4s' }}></div>
        <div className="absolute top-[40%] left-[50%] w-[40vw] h-[40vw] rounded-full bg-accent-pink/10 blur-[100px] mix-blend-screen animate-blob transform-gpu" style={{ animationDelay: '6s' }}></div>
      </div>

      <AppHeader />

      {/* Mobile Tab Bar */}
      <MobileTabBar />

      <ErrorBoundary>
        <div className="relative z-10 w-full max-w-6xl mx-auto min-h-screen pt-4 md:pt-32 pb-28 md:pb-24">
          {/* Key forces React to unmount and remount the view, ensuring entry animations play every time */}
          <div key={location.pathname} className="h-full w-full view-enter">
            <Suspense fallback={<LoadingSpinner />}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/claim" element={<SubscriptionFlow />} />
                <Route path="/claim/:service" element={<SubscriptionFlow />} />
                <Route path="/course" element={<CourseFlow />} />
                <Route path="/course/:service" element={<CourseFlow />} />
                <Route path="/guides" element={<GuidesView />} />
                <Route path="/guides/:id" element={<GuidesView />} />
                <Route path="/simulator" element={<SimulatorView />} />
                <Route path="/radar" element={<RadarView />} />
                <Route path="/faq" element={<FaqView />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}