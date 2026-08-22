import React, { useState } from 'react';
import { ListMusic, Heart, History as HistoryIcon, Sparkles } from 'lucide-react';
import Playlists from './Playlists';
import Favorites from './Favorites';
import History from './History';
import Recommendations from './Recommendations';

type LibraryTab = 'playlists' | 'favorites' | 'history' | 'recommendations';

const Library: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LibraryTab>('playlists');

  const tabs = [
    { id: 'playlists' as const, label: 'Playlists', icon: ListMusic },
    { id: 'favorites' as const, label: 'Favorites', icon: Heart },
    { id: 'history' as const, label: 'History', icon: HistoryIcon },
    { id: 'recommendations' as const, label: 'For You', icon: Sparkles },
  ];

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Sub Tab Navigation */}
      <div className="flex items-center space-x-1 p-1 bg-melo-dark-surface border border-melo-border rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-melo-primary text-white shadow-glow'
                  : 'text-melo-text-secondary-dark hover:text-melo-text-primary-dark'
              }`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto pr-1">
        {activeTab === 'playlists' && <Playlists />}
        {activeTab === 'favorites' && <Favorites />}
        {activeTab === 'history' && <History />}
        {activeTab === 'recommendations' && <Recommendations />}
      </div>
    </div>
  );
};

export default React.memo(Library);
