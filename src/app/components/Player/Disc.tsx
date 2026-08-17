import React from 'react';

interface DiscProps {
  src?: string;
  isPlaying: boolean;
}

const Disc: React.FC<DiscProps> = ({ src, isPlaying }) => {
  return (
    <div className="relative w-28 h-28 mx-auto my-4 shrink-0 flex items-center justify-center">
      {/* Outer ring */}
      <div className={`absolute inset-0 rounded-full border-4 border-melo-dark-hover shadow-elevated transition-transform duration-500 ${isPlaying ? 'scale-105' : 'scale-100'}`} />
      
      {/* Glow effect */}
      <div className={`absolute -inset-2 rounded-full bg-melo-primary/20 blur-xl transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-0'}`} />

      {/* Album Art (spinning) */}
      <img
        src={src || '/icons/icon128.png'}
        alt="Album art"
        className={`w-full h-full rounded-full object-cover z-10 [animation:spin_4s_linear_infinite] ${!isPlaying ? '[animation-play-state:paused]' : ''}`}
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/icons/icon128.png';
        }}
      />
      
      {/* Center hole */}
      <div className="absolute w-6 h-6 bg-melo-dark rounded-full z-20 shadow-inner" />
    </div>
  );
};

export default React.memo(Disc);
