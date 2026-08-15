import React, { useRef, type MouseEvent } from 'react';

interface ProgressBarProps {
  progress: number;
  duration: number;
  onSeek: (time: number) => void;
}

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, duration, onSeek }) => {
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current && duration > 0) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const newTime = (clickX / rect.width) * duration;
      onSeek(newTime);
    }
  };

  const percentage = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="w-full px-4 mb-2">
      <div className="flex justify-between text-xs text-melo-text-subdued mb-1 font-medium tracking-wide">
        <span>{formatTime(progress)}</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div 
        ref={progressBarRef}
        className="w-full h-1.5 bg-melo-dark-hover rounded-full cursor-pointer relative group overflow-hidden"
        onClick={handleSeek}
      >
        <div 
          className="absolute top-0 left-0 h-full bg-melo-primary group-hover:bg-melo-primary-light transition-colors"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default React.memo(ProgressBar);
