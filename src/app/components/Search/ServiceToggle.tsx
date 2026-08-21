import React from 'react';
import { type StreamingService } from '../../../types';
import { Music, Video, AlertTriangle } from 'lucide-react';

interface ServiceToggleProps {
  selectedService: StreamingService;
  onSelect: (service: StreamingService) => void;
  showBetaWarning?: boolean;
}

const ServiceToggle: React.FC<ServiceToggleProps> = ({ selectedService, onSelect, showBetaWarning = true }) => {
  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center p-1 bg-melo-dark-hover/70 rounded-xl border border-melo-border">
        <button
          onClick={() => onSelect('jamendo')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
            selectedService === 'jamendo'
              ? 'bg-melo-primary text-white shadow-glow'
              : 'text-melo-text-secondary-dark hover:text-melo-text-primary-dark'
          }`}
        >
          <Music size={14} />
          <span>Jamendo</span>
        </button>

        <button
          onClick={() => onSelect('youtube')}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-medium transition-all relative ${
            selectedService === 'youtube'
              ? 'bg-red-600 text-white shadow-[0_0_15px_rgba(220,38,38,0.3)]'
              : 'text-melo-text-secondary-dark hover:text-melo-text-primary-dark'
          }`}
        >
          <Video size={14} />
          <span>YouTube</span>
          <span className="text-[9px] bg-amber-400 text-black font-bold px-1 rounded-sm">BETA</span>
        </button>
      </div>

      {showBetaWarning && selectedService === 'youtube' && (
        <div className="flex items-start space-x-2 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[11px] text-amber-300">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <p>
            YouTube streaming is in beta and community user opt-in. Audio playback is streamed without ads.
          </p>
        </div>
      )}
    </div>
  );
};

export default React.memo(ServiceToggle);
