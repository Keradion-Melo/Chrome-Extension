import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Music, Video, PlayCircle, LogOut } from 'lucide-react';
import { type RootState } from '../../../store/store';
import { setAutoplay, setDefaultService } from '../../../store/slices/userSlice';
import { logout, updateProfile } from '../../../services/auth';
import { type StreamingService } from '../../../types';

const Settings: React.FC = () => {
  const dispatch = useDispatch();
  const profile = useSelector((state: RootState) => state.user.profile);
  const preferences = useSelector((state: RootState) => state.user.preferences);

  const handleServiceChange = (service: StreamingService) => {
    dispatch(setDefaultService(service));
    updateProfile({ preferences: { ...preferences, defaultService: service } }).catch(() => {});
  };

  const handleAutoplayToggle = () => {
    const newVal = !preferences.autoplay;
    dispatch(setAutoplay(newVal));
    updateProfile({ preferences: { ...preferences, autoplay: newVal } }).catch(() => {});
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-5 overflow-y-auto pr-1">
      {/* User Profile Card */}
      <div className="flex items-center space-x-3.5 p-3.5 bg-melo-dark-surface border border-melo-border rounded-2xl">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-melo-primary to-melo-primary-hover flex items-center justify-center text-white font-bold text-lg shadow-glow shrink-0">
          {profile?.username?.charAt(0).toUpperCase() || 'M'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-melo-text-primary-dark truncate">
            {profile?.profile?.displayName || profile?.username || 'Melo Listener'}
          </h3>
          <p className="text-[11px] text-melo-text-secondary-dark truncate">{profile?.email || 'user@melo.test'}</p>
          <span className="inline-block text-[9px] bg-melo-primary/20 text-melo-primary font-semibold px-2 py-0.5 rounded-full mt-1">
            Standard Member
          </span>
        </div>
      </div>

      {/* Playback Preferences */}
      <div className="space-y-3">
        <h4 className="text-[11px] font-bold text-melo-text-subdued uppercase tracking-wider px-1">
          Playback & Sources
        </h4>

        {/* Default Service */}
        <div className="p-3 bg-melo-dark-surface border border-melo-border rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-melo-text-primary-dark">Default Music Service</span>
            <span className="text-[11px] text-melo-text-subdued capitalize">{preferences.defaultService}</span>
          </div>
          <div className="flex space-x-2 pt-1">
            <button
              onClick={() => handleServiceChange('jamendo')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                preferences.defaultService === 'jamendo'
                  ? 'bg-melo-primary text-white border-melo-primary shadow-glow'
                  : 'bg-melo-dark-hover/60 border-melo-border text-melo-text-secondary-dark hover:text-melo-text-primary-dark'
              }`}
            >
              <Music size={13} />
              <span>Jamendo</span>
            </button>
            <button
              onClick={() => handleServiceChange('youtube')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                preferences.defaultService === 'youtube'
                  ? 'bg-red-600 text-white border-red-600 shadow-[0_0_12px_rgba(220,38,38,0.3)]'
                  : 'bg-melo-dark-hover/60 border-melo-border text-melo-text-secondary-dark hover:text-melo-text-primary-dark'
              }`}
            >
              <Video size={13} />
              <span>YouTube Beta</span>
            </button>
          </div>
        </div>

        {/* Autoplay Toggle */}
        <div className="flex items-center justify-between p-3 bg-melo-dark-surface border border-melo-border rounded-xl">
          <div className="flex items-center space-x-2.5">
            <PlayCircle size={18} className="text-melo-primary" />
            <div>
              <p className="text-xs font-semibold text-melo-text-primary-dark">Continuous Autoplay</p>
              <p className="text-[10px] text-melo-text-subdued">Play next track in queue automatically</p>
            </div>
          </div>
          <button
            onClick={handleAutoplayToggle}
            className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
              preferences.autoplay ? 'bg-melo-primary' : 'bg-melo-dark-hover'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                preferences.autoplay ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* About & Info */}
      <div className="p-3 bg-melo-dark-surface border border-melo-border rounded-xl space-y-1.5 text-xs text-melo-text-subdued">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-melo-text-secondary-dark">Melo Chrome Extension</span>
          <span>v1.0.0</span>
        </div>
        <p className="text-[10px] text-melo-text-subdued/80">
          Audio-first distraction-free web music player.
        </p>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center space-x-2 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-semibold transition-colors mt-auto"
      >
        <LogOut size={15} />
        <span>Sign Out</span>
      </button>
    </div>
  );
};

export default React.memo(Settings);
