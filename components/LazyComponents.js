import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';

// Loading component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    color: '#888'
  }}>
    <div style={{
      width: '20px',
      height: '20px',
      border: '2px solid #333',
      borderTop: '2px solid #666',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}></div>
    <span style={{ marginLeft: '10px' }}>Carregando...</span>
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Lazy loaded components
export const LazyDonationButton = dynamic(
  () => import('./DonationButton'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const LazyUserProfile = dynamic(
  () => import('./UserProfile'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const LazyMultiplayerGame = dynamic(
  () => import('./MultiplayerGame'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const LazyFriendsManager = dynamic(
  () => import('./FriendsManager'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const LazyStatistics = dynamic(
  () => import('./Statistics'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const LazyAvatarSelector = dynamic(
  () => import('./AvatarSelector'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const LazyActivateBenefitsModal = dynamic(
  () => import('./ActivateBenefitsModal'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const LazyReferralSystem = dynamic(
  () => import('./ReferralSystem'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export const LazyGlobalStats = dynamic(
  () => import('./GlobalStats'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

// Wrapper component with Suspense
export const LazyWrapper = ({ children, fallback = <LoadingSpinner /> }) => (
  <Suspense fallback={fallback}>
    {children}
  </Suspense>
);

// Hook para lazy loading condicional
export const useLazyLoad = (condition, importFn) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (condition && !Component && !loading) {
      setLoading(true);
      importFn()
        .then(module => {
          setComponent(() => module.default || module);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading component:', error);
          setLoading(false);
        });
    }
  }, [condition, Component, loading, importFn]);

  return { Component, loading };
};
