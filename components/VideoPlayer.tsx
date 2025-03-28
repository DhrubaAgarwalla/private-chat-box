"use client";

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface VideoPlayerProps {
  url: string;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleCanPlay = () => setIsLoaded(true);
    const handleError = () => {
      setHasError(true);
      setIsLoaded(false);
      console.error('Error loading video:', url);
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
    };
  }, [url]);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Failed to play video:', err);
        });
      }
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  if (hasError) {
    return (
      <div className="relative w-full max-w-[300px] h-[180px] bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
        <div className="text-red-500 text-center p-4">
          <p>Failed to load video</p>
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm">
            Open directly
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-[300px] rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={url}
        className="w-full rounded-lg"
        preload="metadata"
        playsInline
      />
      
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2 flex items-center justify-between">
        <button
          onClick={togglePlay}
          className="text-white p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        
        <button
          onClick={toggleMute}
          className="text-white p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors"
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-800 bg-opacity-80">
          <div className="animate-pulse text-sm">Loading video...</div>
        </div>
      )}
    </div>
  );
} 