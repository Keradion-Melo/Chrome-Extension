import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../store/store';
import Sidebar from './components/Sidebar/Sidebar';
import { useAudioSync } from './hooks/useAudioSync';
import { LOGO_CIRCLED_DATA_URI } from '../assets/logoBase64';

const App: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  useAudioSync();

  useEffect(() => {
    // 1. Chrome extension message listener
    const handleChromeMessage = (message: any) => {
      if (message && message.type === 'TOGGLE_SIDEBAR') {
        setIsOpen((prev) => !prev);
      }
    };

    // 2. Custom window event for developer console (window.__MELO_TOGGLE__())
    const handleCustomEvent = () => {
      setIsOpen((prev) => !prev);
    };

    // 3. Direct global keyboard shortcut: Alt + M
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'm' || e.key === 'M')) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime?.onMessage) {
        chrome.runtime.onMessage.addListener(handleChromeMessage);
      }
    } catch {
      // Safe fallback
    }

    window.addEventListener('melo:toggle', handleCustomEvent);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime?.id && chrome.runtime?.onMessage) {
          chrome.runtime.onMessage.removeListener(handleChromeMessage);
        }
      } catch {
        // Safe fallback
      }
      window.removeEventListener('melo:toggle', handleCustomEvent);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="font-sans antialiased text-white select-none">
      {/* Floating Dot Trigger with Circled Melo Logo */}
      {!isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            right: 'clamp(12px, 1.5vw, 18px)',
            transform: 'translateY(-50%)',
            zIndex: 2147483647,
            pointerEvents: 'auto',
          }}
        >
          <button
            onClick={() => setIsOpen(true)}
            style={{
              width: 'clamp(50px, 4vw, 54px)',
              height: 'clamp(50px, 4vw, 54px)',
              borderRadius: '50%',
              backgroundColor: '#1E1E28',
              border: '2px solid #E0645D',
              boxShadow: '0 4px 20px rgba(224, 100, 93, 0.45), 0 0 15px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none',
              padding: '2px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.12)';
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(224, 100, 93, 0.75), 0 0 20px rgba(0, 0, 0, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(224, 100, 93, 0.45), 0 0 15px rgba(0, 0, 0, 0.7)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.94)';
            }}
            aria-label="Open Melo Music Player (Alt+M)"
            title="Open Melo Music Player (Alt+M)"
          >
            <img
              src={LOGO_CIRCLED_DATA_URI}
              alt="Melo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                pointerEvents: 'none',
                borderRadius: '50%',
              }}
            />
          </button>
        </div>
      )}

      {/* Floating Rounded Mini-Window with Fluid Responsive Dimensions */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          right: 'clamp(14px, 2vw, 22px)',
          transform: isOpen
            ? 'translateY(-50%) scale(1)'
            : 'translateY(-50%) scale(0.92) translateX(30px)',
          opacity: isOpen ? 1 : 0,
          width: isAuthenticated ? 'min(415px, 92vw)' : 'min(390px, 92vw)',
          maxWidth: 'calc(100vw - 28px)',
          height: isAuthenticated ? 'min(630px, 88vh)' : 'auto',
          maxHeight: 'min(630px, 88vh)',
          backgroundColor: '#17171F',
          borderRadius: '24px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1), 0 10px 30px rgba(224, 100, 93, 0.18)',
          zIndex: 2147483647,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isOpen ? 'auto' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Sidebar isOpen={isOpen} onClose={() => setIsOpen(false)} />
      </div>
    </div>
  );
};

export default App;
