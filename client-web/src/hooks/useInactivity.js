import { useState, useEffect, useCallback } from 'react';

export const useInactivity = (timeoutMinutes) => {
  const [isInactive, setIsInactive] = useState(false);

  const resetTimer = useCallback(() => {
    setIsInactive(false);
  }, []);

  useEffect(() => {
    if (!timeoutMinutes || timeoutMinutes <= 0) return;

    let timer;
    const timeoutMs = timeoutMinutes * 60 * 1000;

    const handleActivity = () => {
      setIsInactive(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIsInactive(true), timeoutMs);
    };

    // Events to track activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => window.addEventListener(event, handleActivity));
    
    // Initial start
    timer = setTimeout(() => setIsInactive(true), timeoutMs);

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity));
      clearTimeout(timer);
    };
  }, [timeoutMinutes]);

  return { isInactive, resetTimer };
};
