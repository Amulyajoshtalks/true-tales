// utils/helpers.js
export const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds === undefined || seconds === null) return '0:00';
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};
