import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Shuffle,
  Repeat,
  Volume2,
  Volume1,
  VolumeX,
} from 'lucide-react';

interface ControlsProps {
  isPlaying: boolean;
  shuffle: boolean;
  repeat: 'none' | 'one' | 'all';
  volume: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onVolumeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Controls: React.FC<ControlsProps> = ({
  isPlaying,
  shuffle,
  repeat,
  volume,
  onPlayPause,
  onNext,
  onPrevious,
  onToggleShuffle,
  onToggleRepeat,
  onVolumeChange,
}) => {
  const [showVolume, setShowVolume] = useState(false);
  const hideTimerRef = useRef<any>(null);
  const prevNonZeroVolume = useRef<number>(0.8);

  // Remember last non-zero volume for quick mute/unmute
  useEffect(() => {
    if (volume > 0) {
      prevNonZeroVolume.current = volume;
    }
  }, [volume]);

  const handleMouseEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
    setShowVolume(true);
  };

  const handleMouseLeave = () => {
    hideTimerRef.current = setTimeout(() => {
      setShowVolume(false);
    }, 280);
  };

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newVol = volume > 0 ? 0 : prevNonZeroVolume.current || 0.8;
    const fakeEvent = {
      target: { value: String(newVol) },
    } as React.ChangeEvent<HTMLInputElement>;
    onVolumeChange(fakeEvent);
  };

  const VolumeIcon = volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div className="flex flex-col space-y-3">
      {/* Playback Row: Shuffle — Prev — Play — Next — Repeat  +  Volume on Hover */}
      <div className="flex items-center justify-between px-1">
        {/* Shuffle */}
        <button
          onClick={onToggleShuffle}
          className={`p-1.5 rounded-lg transition-colors ${
            shuffle
              ? 'text-melo-primary bg-melo-primary/15'
              : 'text-melo-text-subdued hover:text-melo-text-primary-dark'
          }`}
          aria-label="Shuffle"
          title="Shuffle"
        >
          <Shuffle size={15} />
        </button>

        {/* Prev */}
        <button
          onClick={onPrevious}
          className="p-1.5 text-melo-text-secondary-dark hover:text-melo-text-primary-dark transition-colors"
          aria-label="Previous"
          title="Previous"
        >
          <SkipBack size={20} />
        </button>

        {/* Play / Pause */}
        <button
          onClick={onPlayPause}
          className="w-11 h-11 flex items-center justify-center bg-melo-primary text-white rounded-full hover:bg-melo-primary-hover hover:scale-105 active:scale-95 transition-all shadow-glow"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? (
            <Pause size={20} fill="currentColor" />
          ) : (
            <Play size={20} fill="currentColor" className="ml-0.5" />
          )}
        </button>

        {/* Next */}
        <button
          onClick={onNext}
          className="p-1.5 text-melo-text-secondary-dark hover:text-melo-text-primary-dark transition-colors"
          aria-label="Next"
          title="Next"
        >
          <SkipForward size={20} />
        </button>

        {/* Repeat */}
        <button
          onClick={onToggleRepeat}
          className={`p-1.5 rounded-lg transition-colors relative ${
            repeat !== 'none'
              ? 'text-melo-primary bg-melo-primary/15'
              : 'text-melo-text-subdued hover:text-melo-text-primary-dark'
          }`}
          aria-label="Repeat"
          title={`Repeat: ${repeat}`}
        >
          <Repeat size={15} />
          {repeat === 'one' && (
            <span className="absolute text-[8px] font-bold bottom-0 right-0.5 leading-none">1</span>
          )}
        </button>

        {/* Volume: Hover to reveal smooth popup, click to mute/unmute */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <button
            onClick={handleToggleMute}
            className={`p-1.5 rounded-lg transition-colors ${
              showVolume || volume === 0
                ? 'text-melo-primary bg-melo-primary/15'
                : 'text-melo-text-subdued hover:text-melo-text-primary-dark'
            }`}
            aria-label="Volume"
            title={`Volume: ${Math.round(volume * 100)}% (click to ${volume > 0 ? 'mute' : 'unmute'})`}
          >
            <VolumeIcon size={15} />
          </button>

          {/* Volume Popup — vertical slider above icon on hover */}
          {showVolume && (
            <div
              className="absolute bottom-full right-1/2 translate-x-1/2 mb-2 z-50 animate-fadeIn"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="flex flex-col items-center space-y-2 py-3 px-2 rounded-2xl border border-melo-border bg-melo-dark-surface shadow-2xl"
                style={{ width: '42px' }}
              >
                {/* Percentage label */}
                <span className="text-[10px] font-bold text-melo-text-primary-dark select-none">
                  {Math.round(volume * 100)}%
                </span>

                {/* Vertical interactive track slider */}
                <div className="relative flex items-center justify-center h-20 w-4 select-none">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={onVolumeChange}
                    aria-label="Volume"
                    className="cursor-pointer"
                    style={{
                      writingMode: 'vertical-lr' as any,
                      direction: 'rtl',
                      appearance: 'slider-vertical' as any,
                      WebkitAppearance: 'slider-vertical' as any,
                      width: '6px',
                      height: '80px',
                      accentColor: '#E0645D',
                    }}
                  />
                </div>

                {/* Bottom Volume Icon */}
                <button
                  type="button"
                  onClick={handleToggleMute}
                  className="text-melo-text-subdued hover:text-melo-primary transition-colors cursor-pointer"
                  title={volume > 0 ? 'Mute' : 'Unmute'}
                >
                  <VolumeIcon size={12} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Controls);
