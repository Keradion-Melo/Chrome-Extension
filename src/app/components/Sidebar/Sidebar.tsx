import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Moon, Sun, Monitor, X } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { getCurrentUser, updateProfile } from '../../../services/auth';
import { setSessionId } from '../../../store/slices/queueSlice';
import { setTheme, type AppTheme } from '../../../store/slices/userSlice';
import AuthForm from '../Auth/AuthForm';
import NavTabs, { type ActiveTab } from '../Navigation/NavTabs';
import Player from '../Player/Player';
import MiniPlayer from '../Player/MiniPlayer';
import Search from '../Search/Search';
import Library from '../Library/Library';
import Queue from '../Queue/Queue';
import Settings from '../Settings/Settings';
import { LOGO_CIRCLED_DATA_URI } from '../../../assets/logoBase64';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const queue = useSelector((state: RootState) => state.queue.tracks);
  const preferences = useSelector((state: RootState) => state.user.preferences);
  const isPlaying = useSelector((state: RootState) => state.player.isPlaying);
  const currentTrack = useSelector((state: RootState) => state.player.currentTrack);

  const [systemIsDark, setSystemIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Track system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Compute effective theme ('dark' or 'light')
  const effectiveTheme: 'dark' | 'light' = useMemo(() => {
    if (preferences.theme === 'light') return 'light';
    if (preferences.theme === 'dark') return 'dark';
    return systemIsDark ? 'dark' : 'light';
  }, [preferences.theme, systemIsDark]);

  // Default tab is 'library' for idle signed-in users, and 'player' if music is playing
  const [activeTab, setActiveTab] = useState<ActiveTab>(() =>
    isPlaying || currentTrack ? 'player' : 'library',
  );

  const prevIsOpen = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      if (isPlaying || currentTrack) {
        setActiveTab('player');
      } else {
        setActiveTab('library');
      }
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, isPlaying, currentTrack]);

  useEffect(() => {
    dispatch(setSessionId('session_' + Date.now()));
    if (isAuthenticated) {
      getCurrentUser().catch(() => {});
    }
  }, [dispatch, isAuthenticated]);

  const handleCycleTheme = () => {
    const nextTheme: AppTheme =
      preferences.theme === 'system'
        ? 'dark'
        : preferences.theme === 'dark'
        ? 'light'
        : 'system';

    dispatch(setTheme(nextTheme));
    updateProfile({ preferences: { ...preferences, theme: nextTheme } }).catch(() => {});
  };

  const getThemeIconAndLabel = () => {
    switch (preferences.theme) {
      case 'light':
        return {
          icon: <Sun size={14} className="text-amber-500" />,
          title: 'Theme: Light (click for System)',
        };
      case 'dark':
        return {
          icon: <Moon size={14} className="text-blue-400" />,
          title: 'Theme: Night (click for Light)',
        };
      case 'system':
      default:
        return {
          icon: <Monitor size={14} className="text-melo-primary" />,
          title: `Theme: System (${effectiveTheme === 'dark' ? 'Night' : 'Light'}, click for Night)`,
        };
    }
  };

  const themeInfo = getThemeIconAndLabel();

  return (
    <div
      data-theme={effectiveTheme}
      className="flex flex-col h-full bg-melo-dark text-melo-text-primary-dark select-none rounded-3xl overflow-hidden shadow-2xl transition-colors duration-200"
    >
      {/* Window Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-melo-border bg-melo-dark-surface/90 backdrop-blur-md shrink-0">
        {/* Left Melo Brand */}
        <div className="flex items-center space-x-2">
          <img
            src={LOGO_CIRCLED_DATA_URI}
            alt="Melo"
            className="w-5 h-5 object-contain drop-shadow-[0_0_6px_rgba(224,100,93,0.5)]"
          />
          <span className="text-xs font-bold tracking-wide text-melo-primary">Melo</span>
        </div>

        {/* Right Actions: Quick Theme Toggle & Close */}
        <div className="flex items-center space-x-1.5">
          {/* Quick Theme Toggle Button */}
          <button
            onClick={handleCycleTheme}
            className="p-1.5 rounded-lg text-melo-text-subdued hover:text-melo-text-primary-dark hover:bg-melo-dark-hover transition-colors cursor-pointer"
            title={themeInfo.title}
            aria-label={themeInfo.title}
          >
            {themeInfo.icon}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-melo-text-subdued hover:text-melo-text-primary-dark hover:bg-melo-dark-hover transition-colors cursor-pointer"
            aria-label="Close window"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {!isAuthenticated ? (
        <div className="flex-1 overflow-y-auto">
          <AuthForm />
        </div>
      ) : (
        <>
          {/* Navigation Bar */}
          <NavTabs
            activeTab={activeTab}
            onChange={setActiveTab}
            queueCount={queue.length}
          />

          {/* Main Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab === 'player' && (
              <div className="flex flex-col justify-center items-center h-full">
                <div className="w-full">
                  <Player />
                </div>
              </div>
            )}
            {activeTab === 'search' && <Search />}
            {activeTab === 'library' && <Library />}
            {activeTab === 'queue' && <Queue />}
            {activeTab === 'settings' && <Settings />}
          </div>

          {/* Persistent MiniPlayer at bottom when not in Player tab */}
          {activeTab !== 'player' && currentTrack && (
            <MiniPlayer onExpand={() => setActiveTab('player')} />
          )}
        </>
      )}
    </div>
  );
};

export default React.memo(Sidebar);
