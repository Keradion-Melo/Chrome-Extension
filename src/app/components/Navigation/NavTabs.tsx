import React from 'react';
import { Disc, Search, Library, ListMusic, Settings } from 'lucide-react';

export type ActiveTab = 'player' | 'search' | 'library' | 'queue' | 'settings';

interface NavTabsProps {
  activeTab: ActiveTab;
  onChange: (tab: ActiveTab) => void;
  queueCount?: number;
}

const NavTabs: React.FC<NavTabsProps> = ({ activeTab, onChange, queueCount = 0 }) => {
  const tabs = [
    { id: 'player' as const, label: 'Player', icon: Disc },
    { id: 'search' as const, label: 'Search', icon: Search },
    { id: 'library' as const, label: 'Library', icon: Library },
    { id: 'queue' as const, label: 'Queue', icon: ListMusic, badge: queueCount },
    { id: 'settings' as const, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="flex items-center justify-around bg-melo-dark-surface/95 border-b border-melo-border px-2 py-1.5 backdrop-blur-md">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-all duration-200 group ${
              isActive
                ? 'text-melo-primary font-semibold'
                : 'text-melo-text-secondary-dark hover:text-melo-text-primary-dark hover:bg-melo-dark-hover/50'
            }`}
            aria-label={tab.label}
          >
            <div className="relative">
              <Icon size={18} className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-melo-primary text-[10px] text-white font-bold px-1 rounded-full min-w-[14px] text-center">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-melo-primary rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default React.memo(NavTabs);
