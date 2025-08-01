"use client";
import { createContext, useContext, useRef, useState } from "react";

const AudioContext = createContext();

export const useAudio = () => useContext(AudioContext);

export const AudioProvider = ({ children }) => {
  const [currentAudio, setCurrentAudio] = useState(null); // currently playing audioRef
  const [currentAudioId, setCurrentAudioId] = useState(null);

  const playNewAudio = (audioRef, audioId) => {
    // Pause existing
    if (currentAudio && currentAudio !== audioRef) {
      currentAudio.pause();
    }

    // Play new audio
    setCurrentAudio(audioRef);
    setCurrentAudioId(audioId);
  };

  return (
    <AudioContext.Provider value={{ playNewAudio, currentAudioId }}>
      {children}
    </AudioContext.Provider>
  );
};
