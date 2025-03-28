'use client';

import { useState, useRef } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoicePlayerProps {
  url: string;
}

export default function VoicePlayer({ url }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const onEnded = () => {
    setIsPlaying(false);
  };

  return (
    <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
      <button
        onClick={togglePlay}
        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" />
        ) : (
          <Play className="w-5 h-5" />
        )}
      </button>
      <audio
        ref={audioRef}
        src={url}
        onEnded={onEnded}
        className="hidden"
      />
    </div>
  );
} 