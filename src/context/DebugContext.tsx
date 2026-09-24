import React, { createContext, useContext, useState, useEffect } from 'react';

interface DebugContextType {
  isDebugMode: boolean;
  debugToken: string | null;
  openDebugModal: () => void;
  closeDebugModal: () => void;
  deactivateDebugMode: () => void;
  isAuthModalOpen: boolean;
  setDebugActive: (token: string) => void;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: React.ReactNode }) {
  const [isDebugMode, setIsDebugMode] = useState<boolean>(() => {
    return Boolean(sessionStorage.getItem('kinder_debug_token'));
  });
  const [debugToken, setDebugToken] = useState<string | null>(() => {
    return sessionStorage.getItem('kinder_debug_token');
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Validate existing token with server on startup if present
  useEffect(() => {
    const existing = sessionStorage.getItem('kinder_debug_token');
    if (existing) {
      fetch('/api/debug/status', {
        headers: { Authorization: `Bearer ${existing}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.debugMode) {
            setIsDebugMode(true);
            setDebugToken(existing);
          } else {
            // Token expired or invalid
            sessionStorage.removeItem('kinder_debug_token');
            setIsDebugMode(false);
            setDebugToken(null);
          }
        })
        .catch(() => {
          // If offline / local fallback, keep token
        });
    }
  }, []);

  const openDebugModal = () => setIsAuthModalOpen(true);
  const closeDebugModal = () => setIsAuthModalOpen(false);

  const setDebugActive = (token: string) => {
    sessionStorage.setItem('kinder_debug_token', token);
    setDebugToken(token);
    setIsDebugMode(true);
    setIsAuthModalOpen(false);
  };

  const deactivateDebugMode = async () => {
    if (debugToken) {
      try {
        await fetch('/api/debug/revoke', {
          method: 'POST',
          headers: { Authorization: `Bearer ${debugToken}` },
        });
      } catch {
        // ignore
      }
    }
    sessionStorage.removeItem('kinder_debug_token');
    setIsDebugMode(false);
    setDebugToken(null);
  };

  return (
    <DebugContext.Provider
      value={{
        isDebugMode,
        debugToken,
        openDebugModal,
        closeDebugModal,
        deactivateDebugMode,
        isAuthModalOpen,
        setDebugActive,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebugMode(): DebugContextType {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebugMode must be used within a DebugProvider');
  }
  return context;
}
