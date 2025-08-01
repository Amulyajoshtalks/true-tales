'use client';

import { useState, useRef, useEffect } from 'react';
import { formatTime } from '@/utils/helpers';

// Icons remain the same
const PlayIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const SkipForwardIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" clipRule="evenodd" />
  </svg>
);

const SkipBackwardIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M15.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 010 1.414zm-6 0a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 011.414 1.414L5.414 10l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
  </svg>
);

export default function AudioPlayer({ url, className }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const timeRef = useRef(null);

  // Handle global pause of other players
  useEffect(() => {
    const handleGlobalPlay = (e) => {
      if (e.detail !== audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
    window.addEventListener('audioPlay', handleGlobalPlay);
    return () => window.removeEventListener('audioPlay', handleGlobalPlay);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    const updateProgress = () => {
      const current = audio.currentTime;
      setCurrentTime(current);
      
      // Update progress animation
      if (progressRef.current && duration > 0) {
        const progress = (current / duration) * 100;
        progressRef.current.style.width = `${progress}%`;
      }
    };

    const setAudioData = () => {
      const dur = audio.duration;
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      const dur = audio.duration;
      if (!isNaN(dur) && isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', setAudioData);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);

    // Fallback: unlock after 5 seconds if nothing fires
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 5000);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', setAudioData);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      clearTimeout(timeout);
    };
  }, [duration]);

  const togglePlay = () => {
    if (isLoading) return;
    const audio = audioRef.current;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      window.dispatchEvent(new CustomEvent('audioPlay', { detail: audio }));
      audio.play().catch((e) => console.error('Play error:', e));
      setIsPlaying(true);
    }
  };

  const skipForward = () => {
    const audio = audioRef.current;
    if (duration > 0) {
      audio.currentTime = Math.min(audio.currentTime + 5, duration);
    } else {
      audio.currentTime += 5;
    }
    // Animate time change
    if (timeRef.current) {
      timeRef.current.classList.add('animate-pulse');
      setTimeout(() => timeRef.current.classList.remove('animate-pulse'), 300);
    }
  };

  const skipBackward = () => {
    const audio = audioRef.current;
    audio.currentTime = Math.max(audio.currentTime - 5, 0);
    // Animate time change
    if (timeRef.current) {
      timeRef.current.classList.add('animate-pulse');
      setTimeout(() => timeRef.current.classList.remove('animate-pulse'), 300);
    }
  };

  // Calculate progress safely
  const getProgressWidth = () => {
    if (duration > 0 && !isNaN(duration) && !isNaN(currentTime)) {
      return (currentTime / duration) * 100;
    }
    return 0;
  };

  return (
    <div className={className}>
      <audio
        ref={audioRef}
        src={url}
        preload="metadata"
        onLoadedMetadata={() => {
          const dur = audioRef.current.duration;
          if (!isNaN(dur) && isFinite(dur) && dur > 0) {
            setDuration(dur);
          }
          setIsLoading(false);
        }}
      />

      <div className="flex flex-col gap-4">
        {/* Animated time indicator */}
        <div className="flex items-center justify-center">
          <div className="relative bg-gray-200 rounded-full w-full h-1.5 overflow-hidden">
            <div 
              ref={progressRef}
              className="absolute top-0 left-0 h-full bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${getProgressWidth()}%` }}
            >
              {/* Animated moving dot */}
              {duration > 0 && (
                <div 
                  className={`absolute top-1/2 right-0 w-2 h-2 -mt-1 -mr-1 bg-white rounded-full shadow-md ${isPlaying ? 'animate-pulse-slow' : ''}`}
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <span 
            ref={timeRef}
            className="text-xs text-gray-500 font-mono transition-all duration-200"
          >
            {formatTime(currentTime)}
          </span>
          <span className="text-xs text-gray-500 font-mono">
            {duration > 0 ? formatTime(duration) : '--:--'}
          </span>
        </div>

        <div className="flex items-center justify-center gap-6 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white bg-opacity-70 rounded-full flex items-center justify-center z-10">
              <div className="w-6 h-6 border-t-2 border-indigo-600 border-solid rounded-full animate-spin"></div>
            </div>
          )}

          <button
            onClick={skipBackward}
            disabled={isLoading}
            className={`text-gray-700 hover:text-indigo-700 transition-all duration-200 p-2 rounded-full hover:bg-indigo-100 active:scale-95 ${isLoading ? 'opacity-50' : ''}`}
            aria-label="Skip backward 5 seconds"
          >
            <SkipBackwardIcon className="w-6 h-6" />
          </button>

          <button
            onClick={togglePlay}
            disabled={isLoading}
            className={`
              w-12 h-12 rounded-full flex items-center justify-center 
              transition-all duration-300 shadow-md hover:shadow-lg focus:outline-none 
              ${isPlaying 
                ? 'bg-indigo-700 hover:bg-indigo-800' 
                : 'bg-indigo-600 hover:bg-indigo-700'}
              ${isLoading ? 'opacity-70' : ''}
              transform transition-transform duration-300 ${isPlaying ? 'scale-100' : 'scale-100 hover:scale-105'}
            `}
          >
            {isPlaying ? (
              <PauseIcon className="w-5 h-5 text-white transform transition-transform duration-300 hover:scale-110" />
            ) : (
              <PlayIcon className="w-5 h-5 text-white transform transition-transform duration-300 hover:scale-110" />
            )}
          </button>

          <button
            onClick={skipForward}
            disabled={isLoading}
            className={`text-gray-700 hover:text-indigo-700 transition-all duration-200 p-2 rounded-full hover:bg-indigo-100 active:scale-95 ${isLoading ? 'opacity-50' : ''}`}
            aria-label="Skip forward 5 seconds"
          >
            <SkipForwardIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* CSS animations */}
      <style jsx>{`
        @keyframes pulse-slow {
          0% { opacity: 0.7; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
          100% { opacity: 0.7; transform: scale(0.8); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-pulse {
          animation: pulse 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}